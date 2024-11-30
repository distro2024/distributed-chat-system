const express = require('express');
const axios = require('axios');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const clientIo = require('socket.io-client');
const { initiateElection, handleIncomingVote, handleNewCoordinator, sendElectionResponse } = require('./election');

const socketIo = require('socket.io');
const { handleNewMessage } = require('./handleNewMessage');

// Define environment variables with default values
const PORT = process.env.PORT || 4000;
const DIRECTOR_URL = process.env.DIRECTOR_URL || 'http://localhost:3000';
const NODE_HOST = process.env.NODE_HOST || `http://localhost:${PORT}`;

// Using IS_LEADER environment variable to simulate leader election
const IS_LEADER = process.env.IS_LEADER === 'true';

const app = express();
const server = http.createServer(app);
const serverIo = socketIo(server); // initialize socket.io with the server

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const nodeId = uuidv4();

// For now, node1 is always the leader based on the IS_LEADER environment variable
let isCoordinator = IS_LEADER; // false
let coordinatorId = isCoordinator ? nodeId : null;
let coordinatorAddress = isCoordinator ? NODE_HOST : null;

// list of nodes in the network
let nodes = [];

// vector clock for the consistency of the chat
let vectorClock = { [nodeId]: 0 }; // Initialize the vector clock with the current node's ID

// Array to store the discussion
let discussion = [];

// For client-to-node communication
serverIo.on('connection', (socket) => {
    console.log('Client connected');

    // Send the current discussion history to the newly connected client
    socket.emit('discussion', discussion);

    // Listen for incoming messages from clients
    socket.on('client_message', (message) => {
        console.log('Received client_message:', message);
        sendNewMessage(message);
    });
});

// Socket.io namespace for node-to-node communication
const nodesNamespace = serverIo.of('/nodes');
nodesNamespace.on('connection', (socket) => {
    console.log('Node connected');

    // Listen for incoming messages from other nodes
    socket.on('node_message', (msg) => {
        console.log(`Received message from node: ${JSON.stringify(msg)}`);

        // Handle the incoming message
        let temp = handleNewMessage(vectorClock, msg);
        vectorClock = temp.vectorClock;
        discussion = temp.discussion;

        // Broadcast the message to all connected clients
        serverIo.emit('client_message', msg.message);
    });

    // TODO: REMOVE WHEN SAFE
    // Listen for new node registrations
    socket.on('new_node', (node) => {
        console.log(`Received new node: ${JSON.stringify(node)}`);

        // Avoid adding itself if the new node is itself
        if (node.nodeId === nodeId) {
            console.log(`Received new node for itself. Ignoring.`);
            return;
        }

        // Add or update the node in the nodes list
        addOrUpdateNode(node);
    });

    // Listen for updated nodes list
    socket.on('update_nodes', (updatedNodes) => {
        console.log(`Received updated nodes list: ${JSON.stringify(updatedNodes)}`);
        // Update the nodes list
        newNodes = updatedNodes.map((node) => ({
            nodeId: node.nodeId,
            nodeAddress: node.nodeAddress,
            socket: clientIo(`${node.nodeAddress}/nodes`),
            lastHeartbeat: Date.now()
        }));
        nodes = newNodes;
    });

    // Incoming requests regarding election process
    // A vote is received from another node
    socket.on('vote', (voterId) => {
        console.log(`Received vote from ${voterId}`); //remove
        handleIncomingVote(nodeId, voterId, nodes);
    });
    // A new coordinator is elected
    socket.on('update-coordinator', (newCoordinatorId) => {
        let coordinator = handleNewCoordinator(nodeId, newCoordinatorId, nodes, getCoordinator(), setAsCoordinator);
        console.log(`Received new coordinator: ${coordinator.nodeAddress}`); // remove
        coordinatorId = coordinator.nodeId;
        coordinatorAddress = coordinator.nodeAddress;
    });
    // An election request is received
    socket.on('election', (coordinatorCandidateId) => {
        console.log(`Received election request`); // remove
        let coordinator = sendElectionResponse(
            nodeId,
            nodes,
            coordinatorCandidateId,
            getCoordinator(),
            setAsCoordinator
        );
        coordinatorId = coordinator.nodeId;
        coordinatorAddress = coordinator.nodeAddress;
    });
});

//
// COORDINATOR TASKS
//

app.post('/onboard_node', (req, res) => {
    // onboarding a new node to chat
    const newNode = req.body;

    console.log(`Onboarding new node: ${newNode.nodeAddress}`);

    // Prepare a list of current nodes to send to the new node
    const neighbours = nodes.map((node) => ({
        nodeId: node.nodeId,
        nodeAddress: node.nodeAddress
    }));

    addOrUpdateNode(newNode);

    console.log(`New node onboarded: ${newNode.nodeAddress}`);

    console.log(neighbours);
    res.json({ neighbours, discussion });

    // Emit updated nodes list to nodes
    emitUpdatedNodes();
});

// Send heartbeat signals to the director
const sendHeartbeatToDirector = async () => {
    if (isCoordinator) {
        console.log('Sending heartbeat to director...');
        try {
            await axios.post(`${DIRECTOR_URL}/update_coordinator`, {
                nodeId: coordinatorId,
                nodeAddress: coordinatorAddress
            });
            console.log('Heartbeat sent to Director');
        } catch (error) {
            console.error(`Error sending heartbeat to Director: ${error.message}`);
            isCoordinator = false;
            initiateElection(nodeId, nodes, getCoordinator(), setAsCoordinator);
        }
    }
};

//
// END OF COORDINATOR TASKS
//

// Endpoint to receive heartbeats from other nodes
app.post('/heartbeat', (req, res) => {
    if (nodes.some((node) => node.nodeId === req.body.nodeId)) {
        senderNode = nodes.find((node) => node.nodeId === req.body.nodeId);
        // update last heartbeat time for the node
        console.log(`Received heartbeat from node: ${senderNode.nodeAddress}`);
    }

    res.sendStatus(200);
});

const registerWithDirector = async () => {
    // node discovery via Node Director
    console.log(`Registering with Node Director: ${DIRECTOR_URL}`);
    try {
        const newNode = {
            nodeId,
            nodeAddress: NODE_HOST
        };
        const response = await axios.post(`${DIRECTOR_URL}/join_chat`, newNode);
        const coordinator = response.data.coordinator;

        console.log('Registered with Node Director');

        // check whether I'm the coordinator
        isCoordinator = nodeId === coordinator.nodeId;
        // save the coordinator information
        coordinatorId = coordinator.nodeId;
        coordinatorAddress = coordinator.nodeAddress;

        nodes.push({
            nodeId,
            nodeAddress: NODE_HOST,
            socket: clientIo(`${NODE_HOST}/nodes`),
            lastHeartbeat: Date.now()
        });

        // if I'm not the coordinator, onboard with the coordinator
        if (!isCoordinator) {
            console.log(`Onboarding with coordinator:', ${coordinator.nodeAddress}`);
            const response = await axios.post(`${coordinatorAddress}/onboard_node`, newNode);
            const neighbours = response.data.neighbours;
            discussion = response.data.discussion;

            // save the neighbours
            neighbours.forEach((neighbour) => {
                addOrUpdateNode(neighbour);
            });
        } else {
            console.log('Taking over as coordinator. Assuming control...');
        }
    } catch (error) {
        console.error(`Error registering with director: ${error.message}`);
    }
};

const sendNewMessage = async (message) => {
    // If message is an object, extract the message text
    const messageText = typeof message === 'string' ? message : '';

    // Increment the local vector clock
    vectorClock[nodeId] = (vectorClock[nodeId] || 0) + 1;

    const newMessage = {
        id: uuidv4(),
        nodeId,
        vectorClock: { ...vectorClock },
        message: messageText, // Use the extracted message text
        timestamp: Date.now()
    };
    // Save the message for further processing
    let temp = handleNewMessage(vectorClock, newMessage, discussion);
    vectorClock = temp.vectorClock;
    discussion = temp.discussion;

    // Broadcast the message to all other nodes
    for (let node of nodes) {
        console.log(node.nodeId);
        if (node.nodeId !== nodeId && node.socket) {
            node.socket.emit('node_message', newMessage);
        }
    }

    // Emit the message to connected clients
    serverIo.emit('client_message', messageText);
};


const clearZombieNodes = () => {
    if (isCoordinator) {
        hasUpdates = false;
        // Iterate over the nodes list and remove any nodes
        // which have not sent a heartbeat in the last 20 seconds
        for (let node of nodes) {
            if (node.nodeId !== nodeId && node.socket && Date.now() - node.lastHeartbeat > 20000) {
                console.log(`Removing zombie-node: ${node.nodeAddress}`);
                node.socket.disconnect(true);
                nodes = nodes.filter((n) => n.nodeId !== node.nodeId);
                hasUpdates = true;
            }
        }
        if (hasUpdates) {
            // Emit updated nodes list to nodes
            emitUpdatedNodes();
        }
    }
}


setInterval(sendHeartbeatToDirector, 5000);
setInterval(clearZombieNodes, 20000);

const setAsCoordinator = () => {
    console.log("Assuming coordinator role. Taking over the network");
    isCoordinator = true;
    coordinatorId = nodeId;
    coordinatorAddress = NODE_HOST;
    // set last heartbeat to all nodes to current time
    nodes.forEach((node) => {
        node.lastHeartbeat = Date.now();
    });

}

registerWithDirector();

// HEARBEATS
// GLOBAL VARIABLES (IN FUTURE CAN BE MOVED TO ENVIRONMENTAL VARIABLES)
// variable to indicate how many heartbeats can be missed before initiating an election
const maxMissedHeartbeats = 2;
// variable to indicate the T time in milliseconds for the heartbeat
const heartbeatInterval = 5000;
// each node excluding coordinator sends a heartbeat to the coordinator
// in a random interval within T-2T seconds, like in RAFT algorithm.
// If responses to two consecutive heartbeats are not received,
// the coordinator is considered dead and an election is initiated
// Randomize the heartbeat interval for each node within the range of T-2T milliseconds
const thisNodesHeartbeatInterval = Math.floor(Math.random() * heartbeatInterval) + heartbeatInterval;

// Global counter for missed heartbeats
let missedHeartbeats = 0;
// Use axios to send a heartbeat to the coordinator
// if response is 200 OK, reset the missedHeartbeats counter
const sendHeartbeatToCoordinator = async () => {
    if (!isCoordinator) {
        console.log(`Sending heartbeat to coordinator: ${coordinatorAddress}`);
        try {
            const response = await axios.post(`${coordinatorAddress}/heartbeat`, {
                nodeId
            });
            if (response.status === 200) {
                // reset the missedHeartbeats counter
                missedHeartbeats = 0;
            } else {
                // increment the missedHeartbeats counter
                missedHeartbeats++;
            }
        } catch (error) {
            console.error(`Error during heartbeat: ${error}`);
            // in case of an error, increment the missedHeartbeats counter
            missedHeartbeats++;
        }
        if (missedHeartbeats >= maxMissedHeartbeats) {
            let coordinator = initiateElection(nodeId, nodes, getCoordinator(), setAsCoordinator);
            coordinatorId = coordinator.nodeId;
            coordinatorAddress = coordinator.nodeAddress;
        }
    }
};

// Function to add a new node or update an existing node based on its address.
// For example, if a node with the same address already exists, the existing
// node is updated with the new node's information. If the node does not exist,
//  a new node is added to the list.
const addOrUpdateNode = (newNode) => {
    // Find the index of the node with the same address
    const existingNodeIndex = nodes.findIndex((n) => n.nodeAddress === newNode.nodeAddress);

    if (existingNodeIndex !== -1) {
        // If the node already exists, disconnect the existing socket
        if (nodes[existingNodeIndex].socket) {
            nodes[existingNodeIndex].socket.disconnect(true);
            console.log(`Disconnected existing socket for node ${newNode.nodeAddress}`);
        }

        // Create a new socket connection
        nodes[existingNodeIndex] = {
            nodeId: newNode.nodeId,
            nodeAddress: newNode.nodeAddress,
            socket: clientIo(`${newNode.nodeAddress}/nodes`),
            lastHeartbeat: Date.now()
        };

        console.log(`Updated node list with new node: ${newNode.nodeAddress}`);
    } else {
        // Create a new socket connection for the new node
        nodes.push({
            nodeId: newNode.nodeId,
            nodeAddress: newNode.nodeAddress,
            socket: clientIo(`${newNode.nodeAddress}/nodes`),
            lastHeartbeat: Date.now()
        });

        console.log(`Added new node: ${newNode.nodeAddress}`);
    }
};

const emitUpdatedNodes = () => {
    nodesToEmit = nodes.map((node) => ({
        nodeId: node.nodeId,
        nodeAddress: node.nodeAddress
    }));

    for (let node of nodes) {
        if (node.nodeId !== nodeId && node.socket) {
            console.log(`Sending updated nodes list to node: ${node.nodeAddress}`);
            node.socket.emit('update_nodes', nodesToEmit);
        }
    }
}

const getCoordinator = () => {
    return nodes.find((node) => node.nodeId === coordinatorId);
};

setInterval(sendHeartbeatToCoordinator, thisNodesHeartbeatInterval);

server.listen(PORT, () => {
    console.log(`Node service is running on port ${PORT}`);
});
