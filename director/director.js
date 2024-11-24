const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// current coordinator
let coordinator = null;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/join_chat', async (req, res) => {
  // direct new node to coordinator
  const { nodeId, nodeAddress } = req.body;

  console.log('Join request received from node with ID:', nodeId, 'and address:', nodeAddress);

  // if no coordinator yet, assign the new node as coordinator
  if (!coordinator) {
    coordinator = {
      nodeId,
      nodeAddress
    };
  }

  res.json({ coordinator });
});

app.listen(PORT, () => {
  console.log(`Director service is running on port ${PORT}`);
});
