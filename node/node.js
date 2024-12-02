const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { initiateElection } = require('./election');

DIRECTOR_URL = process.env.DIRECTOR_URL || 'http://localhost:3000';
PORT = process.env.PORT || 4000;
NODE_HOST = process.env.NODE_HOST || `http://localhost:${PORT}`;
module.exports = class Node {

    constructor() {
        this.nodeId = uuidv4();
        this.nodes = null;
        this.heartbeatsToDirector = null;
        this.clearingZombienodes = null;

        this.isCoordinator = false;
        this.coordinatorId = null;
        this.coordinatorAddress = null;

        this.discussion = null;


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
        console.log(`Registering with Node Director: ${DIRECTOR_URL}`);
        try {
            let newNodeId = this.nodeId;
            const newNode = {
                newNodeId,
                nodeAddress: NODE_HOST
            };
            const response = await axios.post(`${DIRECTOR_URL}/join_chat`, newNode);
            const coordinator = response.data.coordinator;

            console.log('Registered with Node Director');

            // check whether I'm the coordinator
            this.isCoordinator = newNodeId === coordinator.nodeId;
            // save the coordinator information
            this.coordinatorId = coordinator.nodeId;
            this.coordinatorAddress = coordinator.nodeAddress;

            this.nodes.push({
                newNodeId,
                nodeAddress: NODE_HOST,
                socket: clientIo(`${NODE_HOST}/nodes`),
                lastHeartbeat: Date.now()
            });

            // if I'm not the coordinator, onboard with the coordinator
            if (!this.isCoordinator) {
                console.log(`Onboarding with coordinator:', ${coordinator.nodeAddress}`);
                const response = await axios.post(`${coordinatorAddress}/onboard_node`, newNode);
                const neighbours = response.data.neighbours;
                this.discussion = response.data.discussion;

                // save the neighbours
                neighbours.forEach((neighbour) => {
                    this.addOrUpdateNode(neighbour);
                });
            } else {
                console.log('Taking over as coordinator. Assuming control...');
                this.setAsCoordinator();
            }
        } catch (error) {
            console.error(`Error registering with director: ${error.message}`);
        }
    };

    // Use axios to send a heartbeat to the coordinator
    // if response is 200 OK, reset the missedHeartbeats counter
    sendHeartbeatToCoordinator = async () => {
        if (!this.isCoordinator) {
            console.log(`Sending heartbeat to coordinator: ${coordinatorAddress}`);
            try {
                const response = await axios.post(`${coordinatorAddress}/heartbeat`, {
                    nodeId
                });
                if (response.status === 200) {
                    // reset the missedHeartbeats counter
                    this.missedHeartbeats = 0;
                } else {
                    // increment the missedHeartbeats counter
                    this.missedHeartbeats++;
                }
            } catch (error) {
                console.error(`Error during heartbeat: ${error}`);
                // in case of an error, increment the missedHeartbeats counter
                missedHeartbeats++;
            }
            if (this.missedHeartbeats >= this.maxMissedHeartbeats) {
                let coordinator = initiateElection(this.nodeId, this.nodes, getCoordinator(), setAsCoordinator);
                coordinatorId = coordinator.nodeId;
                coordinatorAddress = coordinator.nodeAddress;
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
                console.log(`Disconnected existing socket for node ${newNode.nodeAddress}`);
            }

            // Create a new socket connection
            this.nodes[existingNodeIndex] = {
                nodeId: newNode.nodeId,
                nodeAddress: newNode.nodeAddress,
                socket: clientIo(`${newNode.nodeAddress}/nodes`),
                lastHeartbeat: Date.now()
            };

            console.log(`Updated node list with new node: ${newNode.nodeAddress}`);
        } else {
            // Create a new socket connection for the new node
            this.nodes.push({
                nodeId: newNode.nodeId,
                nodeAddress: newNode.nodeAddress,
                socket: clientIo(`${newNode.nodeAddress}/nodes`),
                lastHeartbeat: Date.now()
            });

            console.log(`Added new node: ${newNode.nodeAddress}`);
        }
    };

    // COORINATOR TASKS BEGIN
    onboardNode = (req, res) =>  {
        let newNode = req.body;
        let discussion = getDiscussion();
        // onboarding a new node to chat
        console.log(`Onboarding new node: ${newNode.nodeAddress}`);
        // Prepare a list of current nodes to send to the new node
        const neighbours = this.nodes.map((node) => ({
            nodeId: node.nodeId,
            nodeAddress: node.nodeAddress
        }));
        addOrUpdateNode(newNode);
        console.log(`New node onboarded: ${newNode.nodeAddress}`);
        console.log(neighbours);
        res.json({ neighbours, discussion });
        // Emit updated nodes list to nodes
        this.emitUpdatedNodes();
    }


    // Send heartbeat signals to the director
    sendHeartbeatToDirector = async () => {
        console.log('Sending heartbeat to director...');
        try {
            await axios.post(`${DIRECTOR_URL}/update_coordinator`, {
                nodeId: this.coordinatorId,
                nodeAddress: this.coordinatorAddress
            });
            console.log('Heartbeat sent to Director');
        } catch (error) {
            console.error(`Error sending heartbeat to Director: ${error.message}`);
        }
    };

    clearZombieNodes = () => {
        let hasUpdates = false;
        // Iterate over the nodes list and remove any nodes
        // which have not sent a heartbeat in the last 20 seconds
        for (let node of this.nodes) {
            if (node.nodeId !== this.nodeId && node.socket && Date.now() - node.lastHeartbeat > 20000) {
                console.log(`Removing zombie-node: ${node.nodeAddress}`);
                node.socket.disconnect(true);
                nodes = this.nodes.filter((n) => n.nodeId !== node.nodeId);
                hasUpdates = true;
            }
        }
        if (hasUpdates) {
            setNodes(nodes);
            // Emit updated nodes list to nodes
            this.emitUpdatedNodes();
        } else {
            console.log('No zombie nodes found');
        }
    }

    emitUpdatedNodes = () => {
        let nodesToEmit = nodes.map((node) => ({
            nodeId: node.nodeId,
            nodeAddress: node.nodeAddress
        }));
        for (let node of this.nodes) {
            if (node.nodeId !== this.nodeId && node.socket) {
                console.log(`Sending updated nodes list to node: ${node.nodeAddress}`);
                node.socket.emit('update_nodes', nodesToEmit);
            }
        }
    }

    setAsCoordinator = () => {
        console.log("Assuming coordinator role. Taking over the network");
        this.heartbeatsToDirector = setInterval(() => this.sendHeartbeatToDirector(), 5000);
        this.clearingZombienodes = setInterval(() => this.clearZombieNodes(), 20000);
        this.isCoordiantor = true;
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