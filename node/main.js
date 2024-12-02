const express = require('express');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const clientIo = require('socket.io-client');
const { handleIncomingVote, handleNewCoordinator, sendElectionResponse } = require('./election');

const socketIo = require('socket.io');
const { handleNewMessage } = require('./handleNewMessage');

DIRECTOR_URL = process.env.DIRECTOR_URL || 'http://localhost:3000';
PORT = process.env.PORT || 4000;
NODE_HOST = process.env.NODE_HOST || `http://localhost:${PORT}`;

// Create node instance
let nodeInstance = require('./node');
let thisNode = new nodeInstance(DIRECTOR_URL, NODE_HOST);

// Define environment variables with default values

const app = express();
const server = http.createServer(app);
const serverIo = socketIo(server); // initialize socket.io with the server

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


// vector clock for the consistency of the chat
let vectorClock = { [thisNode.nodeId]: 0 }; // Initialize the vector clock with the current node's ID

// For client-to-node communication
serverIo.on('connection', (socket) => {
    console.log('Client connected');

    // Send the current discussion history to the newly connected client
    socket.emit('discussion', thisNode.getDiscussion());

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
        thisNode.setDiscussion(temp.discussion);

        // Broadcast the message to all connected clients
        serverIo.emit('client_message', msg.message);
    });

    // TODO: REMOVE WHEN SAFE
    // Listen for new node registrations
    socket.on('new_node', (node) => {
        console.log(`Received new node: ${JSON.stringify(node)}`);

        // Avoid adding itself if the new node is itself
        if (node.nodeId === thisNode.nodeId) {
            console.log(`Received new node for itself. Ignoring.`);
            return;
        }

        // Add or update the node in the nodes list
        thisNode.addOrUpdateNode(node);
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
        thisNode.setNodes(newNodes);
    });

    // Incoming requests regarding election process
    // A vote is received from another node
    socket.on('vote', (voterId) => {
        console.log(`Received vote from ${voterId}`); //remove
        handleIncomingVote(
            thisNode.nodeId,
            voterId,
            thisNode.getNodes());
    });
    // A new coordinator is elected
    socket.on('update-coordinator', (newCoordinatorId) => {
        let coordinator = handleNewCoordinator(
            thisNode.nodeId,
            newCoordinatorId,
            thisNode.getNodes(),
            thisNode.getCoordinator(),
            thisNode.setAsCoordinator);
        console.log(`Received new coordinator: ${coordinator.nodeAddress}`); // remove
        thisNode.coordinatorId = coordinator.nodeId;
        thisNode.coordinatorAddress = coordinator.nodeAddress;
    });
    // An election request is received
    socket.on('election', (coordinatorCandidateId) => {
        console.log(`Received election request`); // remove
        let coordinator = sendElectionResponse(
            thisNode.nodeId,
            thisNode.getNodes(),
            coordinatorCandidateId,
            thisNode.getCoordinator(),
            thisNode.setAsCoordinator
        );
        thisNode.coordinatorId = coordinator.nodeId;
        thisNode.coordinatorAddress = coordinator.nodeAddress;
    });
});

//
// COORDINATOR TASKS
//

app.post('/onboard_node', (req, res) => {
    if (thisNode.isCoordinator && req.body && req.body.nodeId !== thisNode.nodeId) {
        thisNode.onboardNode(req, res);
    }
});

//
// END OF COORDINATOR TASKS
//

// Endpoint to receive heartbeats from other nodes
app.post('/heartbeat', (req, res) => {
    if (thisNode.getNodes().some((node) => node.nodeId === req.body.nodeId)) {
        senderNode = thisNode.getNodes().find((node) => node.nodeId === req.body.nodeId);
        console.log(`Received heartbeat from node: ${senderNode.nodeAddress}`);
        // update last heartbeat time for the node
        thisNode.getNodes().find((node) => node.nodeId === req.body.nodeId).lastHeartbeat = Date.now();
    }

    res.sendStatus(200);
});

const sendNewMessage = async (message) => {
    // If message is an object, extract the message text
    const messageText = typeof message === 'string' ? message : '';

    // Increment the local vector clock
    vectorClock[thisNode.nodeId] = (vectorClock[thisNode.nodeId] || 0) + 1;

    const newMessage = {
        id: uuidv4(),
        nodeId: thisNode.nodeId,
        nodeHost: thisNode.nodeHost,
        vectorClock: { ...vectorClock },
        message: messageText, // Use the extracted message text
        timestamp: Date.now()
    };
    // Save the message for further processing
    let temp = handleNewMessage(vectorClock, newMessage, thisNode.getDiscussion());
    vectorClock = temp.vectorClock;
    thisNode.setDiscussion(temp.discussion);

    // Broadcast the message to all other nodes
    for (let node of thisNode.getNodes()) {
        console.log(node.nodeId);
        if (node.nodeId !== thisNode.nodeId && node.socket) {
            node.socket.emit('node_message', newMessage);
        }
    }

    // Emit the message to connected clients
    serverIo.emit('client_message', messageText);
};

server.listen(PORT, () => {
    console.log(`Node service is running on port ${PORT}`);
});
