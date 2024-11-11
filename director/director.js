const express = require('express');
const path = require('path');
const app = express();
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
