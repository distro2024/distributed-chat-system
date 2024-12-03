const { handleNewMessage } = require('./handleNewMessage');
const { handleIncomingVote, handleNewCoordinator, sendElectionResponse } = require('./election');
const socketIo = require('socket.io');
const clientIo = require('socket.io-client');

module.exports = (server, { thisNode }) => {
    const serverIo = socketIo(server);

    // For client-to-node communication
    serverIo.on('connection', (socket) => {
        console.log('Client connected');

        // Send the current discussion history to the newly connected client
        socket.emit('discussion', thisNode.discussion);

        // Listen for incoming messages from clients
        socket.on('client_message', (message) => {
            console.log('Received client_message:', message);
            thisNode.sendNewMessage(message, serverIo);
        });
    });

    // Socket.io namespace for node-to-node communication
    const nodesNamespace = serverIo.of('/nodes');
    nodesNamespace.on('connection', (socket) => {
        console.log('Node connected');

        // Listen for incoming messages from other nodes
        socket.on('node_message', (msg) => {
            console.log(msg);
            console.log(`Received message from node: ${JSON.stringify(msg)}`);

            // Handle the incoming message
            let temp = handleNewMessage(thisNode.vectorClock, msg);
            thisNode.vectorClock = temp.vectorClock;
            thisNode.discussion = temp.discussion;

            // Broadcast the message to all connected clients
            serverIo.emit('client_message', msg);
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
            thisNode.nodes = newNodes;
        });

        // Incoming requests regarding election process
        // A vote is received from another node
        socket.on('vote', (voterId) => {
            console.log(`Received vote from ${voterId}`); //remove
            handleIncomingVote(thisNode.nodeId, voterId, thisNode.nodes);
        });
        // A new coordinator is elected
        socket.on('update-coordinator', (newCoordinatorId) => {
            let coordinator = handleNewCoordinator(thisNode.nodeId, newCoordinatorId, thisNode.nodes, thisNode.getCoordinator(), thisNode.setAsCoordinator);
            console.log(`Received new coordinator: ${coordinator.nodeAddress}`); // remove
            thisNode.coordinatorId = coordinator.nodeId;
            thisNode.coordinatorAddress = coordinator.nodeAddress;
        });
        // An election request is received
        socket.on('election', (coordinatorCandidateId) => {
            console.log(`Received election request`); // remove
            let coordinator = sendElectionResponse(
                thisNode.nodeId,
                thisNode.nodes,
                coordinatorCandidateId,
                thisNode.getCoordinator(),
                thisNode.setAsCoordinator
            );
            thisNode.coordinatorId = coordinator.nodeId;
            thisNode.coordinatorAddress = coordinator.nodeAddress;
        });
    });
}
