const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const clientIo = require('socket.io-client');

const { initiateElection } = require('./election');
const log = require('./constants').log;
const { handleNewMessage } = require('./handleNewMessage');

module.exports = class Node {

    constructor(DIRECTOR_URL, NODE_HOST) {
        this.nodeId = uuidv4();
        this.nodes = [];
        this.heartbeatsToDirector = null;
        this.clearingZombienodes = null;

        this.isCoordinator = false;
        this.coordinatorId = null;
        this.coordinatorAddress = null;

        this.discussion = [];
        this.directorUrl = DIRECTOR_URL;
        this.nodeHost = NODE_HOST;

        // vector clock for the consistency of the chat
        this.vectorClock = { [this.nodeId]: 0 }; // Initialize the vector clock with the current node's ID


        // HEARBEATS
        // GLOBAL VARIABLES (IN FUTURE CAN BE MOVED TO ENVIRONMENTAL VARIABLES)
        // variable to indicate how many heartbeats can be missed before initiating an election
        this.maxMissedHeartbeats = 2;
        // variable to indicate the T time in milliseconds for the heartbeat
        this.heartbeatInterval = 5000;
        // each node excluding coordinator sends a heartbeat to the coordinator
        // in a random interval within T-2T seconds, like in RAFT algorithm.
        // If responses to two consecutive heartbeats are not received,
        // the coordinator is considered dead and an election is initiated
        // Randomize the heartbeat interval for each node within the range of T-2T milliseconds
        this.thisNodesHeartbeatInterval = Math.floor(Math.random() * this.heartbeatInterval) + this.heartbeatInterval;
        // Counter for missed heartbeats
        this.missedHeartbeats = 0;
        setInterval(this.sendHeartbeatToCoordinator, this.thisNodesHeartbeatInterval);

        this.registerWithDirector();
    }

    registerWithDirector = async () => {
        // node discovery via Node Director
        console.log(`${log.INFO} Registering with Node Director: ${this.directorUrl}`);
        try {
            const newNode = {
                nodeId: this.nodeId,
                nodeAddress: this.nodeHost
            };
            console.log(`${log.INFO} newNode: ${JSON.stringify(newNode)}`);
            const response = await axios.post(`${this.directorUrl}/join_chat`, newNode);
            const coordinator = response.data.coordinator;

            console.log(`${log.INFO} Registered with Node Director`);

            // save the coordinator information
            this.coordinatorId = coordinator.nodeId;
            this.coordinatorAddress = coordinator.nodeAddress;

            this.nodes.push({
                nodeId: this.nodeId,
                nodeAddress: this.nodeHost,
                socket: clientIo(`${this.nodeHost}/nodes`),
                lastHeartbeat: Date.now()
            });

            // if I'm not the coordinator, onboard with the coordinator
            if (!(this.nodeId === coordinator.nodeId)) {
                console.log(`${log.INFO} Onboarding with coordinator:', ${coordinator.nodeAddress}`);
                const response = await axios.post(`${this.coordinatorAddress}/onboard_node`, newNode);
                const neighbours = response.data.neighbours;
                this.discussion = response.data.discussion;

                // save the neighbours
                neighbours.forEach((neighbour) => {
                    this.addOrUpdateNode(neighbour);
                });
            } else {
                this.setAsCoordinator();
            }
        } catch (error) {
            console.error(`${log.ERROR} Error registering with director: ${error.message}`);
        }
    };

    // Use axios to send a heartbeat to the coordinator
    // the coordinator responds with a 200 status code
    sendHeartbeatToCoordinator = async () => {
        if (!this.isCoordinator) {
            console.log(`${log.SCHEDULED_TASK} ${log.NODE} Sending heartbeat to coordinator: ${this.coordinatorAddress}`);
            try {
                await axios.post(`${this.coordinatorAddress}/heartbeat`, {
                    nodeId: this.nodeId
                });
                this.missedHeartbeats = 0;
                console.log(`${log.SCHEDULED_TASK} ${log.NODE} Coordinator responded to heartbeat`);
            } catch (error) {
                console.error(`${log.ERROR} Error during heartbeat: ${error}`);
                // in case of an error, increment the missedHeartbeats counter
                this.missedHeartbeats++;
            }
            if (this.missedHeartbeats >= this.maxMissedHeartbeats) {
                let coordinator = initiateElection(this.nodeId, this.nodes, this.getCoordinator(), this.setAsCoordinator);
                this.coordinatorId = coordinator.nodeId;
                this.coordinatorAddress = coordinator.nodeAddress;
            }
        }
    };

    // Function to add a new node or update an existing node based on its address.
    // For example, if a node with the same address already exists, the existing
    // node is updated with the new node's information. If the node does not exist,
    //  a new node is added to the list.
    addOrUpdateNode = (newNode) => {
        // Find the index of the node with the same address
        const existingNodeIndex = this.nodes.findIndex((n) => n.nodeAddress === newNode.nodeAddress);

        if (existingNodeIndex !== -1) {
            // If the node already exists, disconnect the existing socket
            if (this.nodes[existingNodeIndex].socket) {
                this.nodes[existingNodeIndex].socket.disconnect(true);
                console.log(`${log.INFO} Disconnected existing socket for node ${newNode.nodeAddress}`);
            }

            // Create a new socket connection
            this.nodes[existingNodeIndex] = {
                nodeId: newNode.nodeId,
                nodeAddress: newNode.nodeAddress,
                socket: clientIo(`${newNode.nodeAddress}/nodes`),
                lastHeartbeat: Date.now()
            };

            console.log(`${log.INFO} Updated node list with new node: ${newNode.nodeAddress}`);
        } else {
            // Create a new socket connection for the new node
            this.nodes.push({
                nodeId: newNode.nodeId,
                nodeAddress: newNode.nodeAddress,
                socket: clientIo(`${newNode.nodeAddress}/nodes`),
                lastHeartbeat: Date.now()
            });

            console.log(`${log.INFO} Added new node: ${newNode.nodeAddress}`);
        }
    };

    sendNewMessage = async (message, socket) => {
        // If message is an object, extract the message text
        const messageText = typeof message === 'string' ? message : '';

        // Increment the local vector clock
        this.vectorClock[this.nodeId] = (this.vectorClock[this.nodeId] || 0) + 1;

        const newMessage = {
            id: uuidv4(),
            nodeId: this.nodeId,
            nodeHost: this.nodeHost,
            vectorClock: { ...this.vectorClock },
            message: messageText, // Use the extracted message text
            timestamp: Date.now()
        };
        // Save the message for further processing
        let temp = handleNewMessage(this.vectorClock, newMessage, this.discussion);
        this.vectorClock = temp.vectorClock;
        this.discussion = temp.discussion;

        // Broadcast the message to all other nodes
        for (let node of this.nodes) {
            console.log(node.nodeId);
            if (node.nodeId !== this.nodeId && node.socket) {
                node.socket.emit('node_message', newMessage);
            }
        }

        // Emit the message to connected clients
        socket.emit('client_message', newMessage);
    };

    // COORINATOR TASKS BEGIN
    onboardNode = (req, res) =>  {
        let newNode = req.body;
        // onboarding a new node to chat
        console.log(`${log.INFO} ${log.COORDINATOR} Onboarding new node: ${newNode.nodeAddress}`);
        // Prepare a list of current nodes to send to the new node
        const neighbours = this.nodes.map((node) => ({
            nodeId: node.nodeId,
            nodeAddress: node.nodeAddress
        }));
        this.addOrUpdateNode(newNode);
        console.log(`${log.INFO} ${log.COORDINATOR} New node onboarded: ${newNode.nodeAddress}`);
        res.json({ neighbours, discussion: this.discussion });
        // Emit updated nodes list to nodes
        this.emitUpdatedNodes();
    }


    // Send heartbeat signals to the director
    sendHeartbeatToDirector = async () => {
        console.log(`${log.SCHEDULED_TASK} ${log.COORDINATOR} Sending heartbeat to director: ${this.directorUrl}`);
        try {
            await axios.post(`${this.directorUrl}/update_coordinator`, {
                nodeId: this.coordinatorId,
                nodeAddress: this.coordinatorAddress
            });
            console.log(`${log.SCHEDULED_TASK} ${log.COORDINATOR} Heartbeat sent to Director`);
        } catch (error) {
            console.error(`${log.SCHEDULED_TASK} ${log.COORDINATOR} Error sending heartbeat to Director: ${error.message}`);
        }
    };

    clearZombieNodes = () => {
        console.log(`${log.SCHEDULED_TASK} ${log.COORDINATOR} Searching for zombie nodes`)
        let hasUpdates = false;
        // Iterate over the nodes list and remove any nodes
        // which have not sent a heartbeat in the last 20 seconds
        for (let node of this.nodes) {
            if (node.nodeId !== this.nodeId && node.socket && Date.now() - node.lastHeartbeat > 20000) {
                console.log(`${log.SCHEDULED_TASK} ${log.COORDINATOR} Removing zombie-node: ${node.nodeAddress}`);
                node.socket.disconnect(true);
                this.nodes = this.nodes.filter((n) => n.nodeId !== node.nodeId);
                hasUpdates = true;
            }
        }
        if (hasUpdates) {
            // Emit updated nodes list to nodes
            this.emitUpdatedNodes();
        } else {
            console.log(`${log.SCHEDULED_TASK} ${log.COORDINATOR} No zombie nodes found`);
        }
    }

    emitUpdatedNodes = () => {
        let nodesToEmit = this.nodes.map((node) => ({
            nodeId: node.nodeId,
            nodeAddress: node.nodeAddress
        }));
        for (let node of this.nodes) {
            if (node.nodeId !== this.nodeId && node.socket) {
                console.log(`${log.INFO} ${log.COORDINATOR} Sending updated nodes list to node: ${node.nodeAddress}`);
                node.socket.emit('update_nodes', nodesToEmit);
            }
        }
    }

    setAsCoordinator = () => {
        if (!this.isCoordinator) {
            console.log(`${log.INFO} ${log.COORDINATOR} Assuming coordinator role`);
            this.isCoordinator = true;
            this.coordinatorAddress = this.nodeHost;
            this.coordinatorId = this.nodeId;
            this.heartbeatsToDirector = setInterval(() => this.sendHeartbeatToDirector(), 5000);
            this.clearingZombienodes = setInterval(() => this.clearZombieNodes(), 20000);
        }
    }

    clearIntervals = () => {
        clearInterval(this.heartbeatsToDirector);
        clearInterval(this.clearingZombienodes);
    }
    // COORDINATOR TASKS END

    // GETTERS AND SETTERS
    getNodes = () => {
        return this.nodes;
    }

    setNodes = (nodes) => {
        this.nodes = nodes;
    }

    getCoordinator = () => {
        return this.nodes.find((node) => node.nodeId === this.coordinatorId);
    };

    getDiscussion = () => {
        return this.discussion;
    }

    setDiscussion = (discussion) => {
        this.discussion = discussion;
    }

}