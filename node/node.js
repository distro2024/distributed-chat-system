const express = require('express');
const axios = require('axios');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const NODE_SERVER_PORT = process.env.PORT || 4000;
const NODE_HOST = process.env.NODE_HOST || 'localhost';
const PUBLIC_HOST = process.env.PUBLIC_HOST || 'localhost';
const DIRECTOR_URL = process.env.DIRECTOR_URL || 'http://localhost:3000';

const nodeId = uuidv4();

const app = express();

app.use(cors());
const server = http.createServer(app);

app.use(express.static(path.join(__dirname, 'public')));

async function registerNode() {
    try {
      const internalAddress = `http://${NODE_HOST}:${NODE_SERVER_PORT}`;
      const publicAddress = `http://${PUBLIC_HOST}:${NODE_SERVER_PORT}`;
  
      await axios.post(`${DIRECTOR_URL}/register_node`, {
        nodeId,
        internalAddress,
        publicAddress
      });
      console.log(`Registered node with id, ${nodeId}, internal address ${internalAddress}, public address ${publicAddress}`);
    } catch (error) {
      console.error('Error registering node:', error);
    }
  }

setInterval(async () => {
    try {
      await axios.post(`${DIRECTOR_URL}/heartbeat`, { nodeId });
    } catch (error) {
      console.error('Error sending heartbeat:', error);
    }
  }, 5000);

async function connectToPeers() {
    try {
        const res = await axios.get(`${DIRECTOR_URL}/active_nodes`);
        const activeNodes = res.data;

        // TODO: Connect to each peer and use socket.io to communicate

    } catch (error) {
    }
}

(async () => {
    await registerNode();
    server.listen(NODE_SERVER_PORT, () => {
      console.log(`Node is running on port ${NODE_SERVER_PORT}`);
    });
    await connectToPeers();
    setInterval(connectToPeers, 10000);
  })();