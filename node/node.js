const express = require('express');
const axios = require('axios');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const PORT = process.env.PORT || 4000;
const DIRECTOR_URL = process.env.DIRECTOR_URL || 'http://localhost:3000';
const NODE_HOST = process.env.NODE_HOST || `http://localhost:${PORT}`;
const PUBLIC_HOST = process.env.PUBLIC_HOST || `http://localhost:${PORT}`;

// Using IS_LEADER environment variable to simulate leader election
const IS_LEADER = process.env.IS_LEADER === "true";

const app = express();
const server = http.createServer(app);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const nodeId = uuidv4();

// For now, node1 is always the leader based on the IS_LEADER environment variable
let isLeader = IS_LEADER; // testing
let leaderId = IS_LEADER ? nodeId : null;
let leaderAddress = IS_LEADER ? NODE_HOST : null;
let leaderPublicAddress = IS_LEADER ? PUBLIC_HOST : null;

const sendHeartbeatToDirector = async () => {
  if (isLeader) {
    try {
      await axios.post(`${DIRECTOR_URL}/register_leader`, { leaderId, leaderAddress, leaderPublicAddress });
      console.log('Heartbeat sent to Director');
    } catch (error) {
      console.error('Error sending heartbeat to Director:', error.message);
      isLeader = false;
      // TOOD initiateElection();
    }
  }
};

setInterval(sendHeartbeatToDirector, 5000);

server.listen(PORT, () => {
  console.log(`Node service is running on port ${PORT}`);
  if (!leaderId) {
    // TODO initiateElection();
  }
});