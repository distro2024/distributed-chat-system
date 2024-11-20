const express = require('express');
const path = require('path');
const app = express();
const axios = require('axios');

const PORT = process.env.PORT || 3000;

let currentLeader = null;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/register_leader', (req, res) => {
    const { leaderId, leaderAddress, leaderPublicAddress } = req.body;
    currentLeader = { leaderId, leaderAddress, leaderPublicAddress };
    console.log(`Leader registered: ${leaderId}, internal address ${leaderAddress}, public address ${leaderPublicAddress}`);
    res.sendStatus(200);
});

app.post('/register_node', async (req, res) => {
    const { nodeId, nodeAddress, publicAddress } = req.body;
    console.log(`Director received registration from node: ${nodeId}, internal address ${nodeAddress}, public address ${publicAddress}`);
    if (currentLeader) {
        try {
            const response = await axios.post(`${currentLeader.leaderAddress}/register_node`, { nodeId, nodeAddress, publicAddress });
            res.sendStatus(200);
        } catch (err) {
            console.error('Error forwarding registration to leader:', err.message);
            res.status(500).send('Failed to register node with leader');
        }
    } else {
        console.log('No leader available to register node.');
        res.sendStatus(200);
    }
});


app.get('/', (req, res) => {
    if (currentLeader) {
        res.redirect(currentLeader.leaderPublicAddress);
    } else {
        res.status(503).send('No Leader available');
    }
});

app.listen(PORT, () => {
    console.log(`Director service is running on port ${PORT}`);
});
