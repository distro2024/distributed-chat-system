const express = require('express');

module.exports = ({ thisNode }) => {
    const coordinatorRouter = express.Router();

    // Endpoint to onboard a new node
    coordinatorRouter.post('/onboard_node', (req, res) => {
        if (thisNode.isCoordinator && req.body && req.body.nodeId !== thisNode.nodeId) {
            thisNode.onboardNode(req, res);
        }
    });

    // Endpoint to receive heartbeats from other nodes
    coordinatorRouter.post('/heartbeat', (req, res) => {
        if (thisNode.getNodes().some((node) => node.nodeId === req.body.nodeId)) {
            senderNode = thisNode.getNodes().find((node) => node.nodeId === req.body.nodeId);
            console.log(`Received heartbeat from node: ${senderNode.nodeAddress}`);
            // update last heartbeat time for the node
            thisNode.getNodes().find((node) => node.nodeId === req.body.nodeId).lastHeartbeat = Date.now();
        }

        res.sendStatus(200);
    });

    return coordinatorRouter;
};
