const express = require('express');
const path = require('path');
const app = express();
const log = require('../node/constants').log;


// current coordinator
let coordinator = null;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/join_chat', async (req, res) => {
    // direct new node to coordinator
    const { nodeId, nodeAddress } = req.body;

    console.log(`${log.INFO} Join request received from node with ID: ${nodeId} and address: ${nodeAddress}`);

    // if no coordinator yet, assign the new node as coordinator
    if (!coordinator) {
        coordinator = {
            nodeId,
            nodeAddress
        };
    }

    res.json({ coordinator });
});

app.post('/update_coordinator', async (req, res) => {
    // update the coordinator
    const { nodeId, nodeAddress } = req.body;
    if (coordinator.nodeId === nodeId) {
        console.log(` ${log.INFO} Heartbeat received from coordinator: ${nodeAddress}`);
        return res.sendStatus(200);
    } else {
        console.log(`${log.INFO} New coordinator elected. Updating coordinator to node: ${nodeAddress}`);
        coordinator = {
            nodeId,
            nodeAddress
        };
        console.log(`${log.INFO} Coordinator updated.`);
    }

    res.sendStatus(200);
});

module.exports = app;
