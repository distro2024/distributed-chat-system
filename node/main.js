const express = require('express');
const http = require('http');
const path = require('path');

const nodeSockets = require('./sockets');
const coordinatorRouter = require('./coordinatorRouter');

// Define environment variables with default values
DIRECTOR_URL = process.env.DIRECTOR_URL || 'http://localhost:3000';
PORT = process.env.PORT || 4000;
NODE_HOST = process.env.NODE_HOST || `http://localhost:${PORT}`;

// Create node instance
let nodeInstance = require('./node');
let thisNode = new nodeInstance(DIRECTOR_URL, NODE_HOST);

const app = express();
const server = http.createServer(app);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(coordinatorRouter({ thisNode }));

nodeSockets(server, { thisNode });

server.listen(PORT, () => {
    console.log(`Node service is running on port ${PORT}`);
});
