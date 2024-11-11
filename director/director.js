const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

let activeNodes = {};
let nodeList = [];
let nextNodeIndex = 0;

app.use(express.json());

app.post('/register_node', (req, res) => {
  const { nodeId, internalAddress, publicAddress } = req.body;
  activeNodes[nodeId] = {
    internalAddress,
    publicAddress,
    lastHeartbeat: Date.now()
  };
  if (!nodeList.includes(nodeId)) {
    nodeList.push(nodeId);
  }
  console.log(`Node registered: ${nodeId}, internal address ${internalAddress}, public address ${publicAddress}`);
  res.sendStatus(200);
});

app.post('/heartbeat', (req, res) => {
  const { nodeId } = req.body;
  if (activeNodes[nodeId]) {
    activeNodes[nodeId].lastHeartbeat = Date.now();
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

app.get('/active_nodes', (req, res) => {
  res.json(activeNodes);
});

setInterval(() => {
  const now = Date.now();
  for (const nodeId in activeNodes) {
    if (now - activeNodes[nodeId].lastHeartbeat > 15000) {
      console.log(`Node removed due to timeout: ${nodeId}`);
      delete activeNodes[nodeId];
      nodeList = nodeList.filter(id => id !== nodeId);
    }
  }
}, 5000);

app.get('/', (req, res) => {
  if (nodeList.length === 0) {
    res.status(503).send('No nodes available');
    return;
  }

  const nodeId = nodeList[nextNodeIndex];

  // Round Robin
  nextNodeIndex = (nextNodeIndex + 1) % nodeList.length;

  const nodePublicAddress = activeNodes[nodeId].publicAddress;

  res.redirect(nodePublicAddress);
});

app.listen(PORT, () => {
  console.log(`Director service is running on port ${PORT}`);
});