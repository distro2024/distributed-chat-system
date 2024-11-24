const express = require("express")
const axios = require("axios")
const http = require("http")
const { v4: uuidv4 } = require("uuid")
const path = require("path")
const clientIo = require("socket.io-client");
const { 
  initiateElection, 
  handleIncomingVote, 
  handleNewCoordinator, 
  sendElectionResponse } = require("./election")

const socketIo = require("socket.io");
const {handleNewMessage} = require('./handleNewMessage');

const PORT = process.env.PORT || 4000
const DIRECTOR_URL = process.env.DIRECTOR_URL || "localhost:3000"
const NODE_HOST = process.env.NODE_HOST || `localhost:${PORT}`
const PUBLIC_HOST = process.env.PUBLIC_HOST || `localhost:${PORT}`

// Using IS_LEADER environment variable to simulate leader election
const IS_LEADER = process.env.IS_LEADER === "true"

const app = express()
const server = http.createServer(app)
const serverIo = socketIo(server); // initialize socket.io with the server

app.use(express.static(path.join(__dirname, "public")))
app.use(express.json())

const nodeId = uuidv4()

// For now, node1 is always the leader based on the IS_LEADER environment variable

let isCoordinator = false
let coordinatorId = isCoordinator ? nodeId : null
let coordinatorAddress = IS_LEADER ? NODE_HOST : null
let coordinatorPublicAddress = IS_LEADER ? PUBLIC_HOST : null


// list of nodes in the network
let nodes = []
// vector clock for the consistency of the chat
let vectorClock = {nodeId: 0} // Initialize the vector clock with the current node's ID

serverIo.on('connection', (socket) => {
  console.log('listening sockets'); //remove

  socket.on('message', (msg) => {
    console.log(`Received message: ${msg}`); //remove
    let temp = handleNewMessage(vectorClock, msg);
    // Update the local vector clock
    vectorClock = temp[0];
    // Save the message for further processing
    let discussion = temp[1];
  });


  // Incoming requests regarding election process
  // A vote is received from another node
  socket.on('vote', (voterId) => {
    console.log(`Received vote from ${voterId}`); //remove
    handleIncomingVote(voterId, nodes);
  });
  // A new coordinator is elected
  coordinator = socket.on('update-coordinator', (newCoordinatorId) => {
    console.log(`Received new coordinator: ${newCoordinatorId}`); // remove
    coordinator = handleNewCoordinator(nodeId, newCoordinatorId, nodes, coordinator, registerWithDirector);
    coordinatorId = coordinator.id;
    coordinatorAddress = coordinator.address;
  });
  // An election request is received
  socket.on('election', (coordinatorCandidateId) => {
    console.log(`Received election request`); // remove
    sendElectionResponse(nodeId, nodes, coordinatorCandidateId, coordinator, registerWithDirector);
  });
});

//
// COORDINATOR TASKS
//

app.post('/onboard_node', (req, res) => {
  // onboarding a new node to chat
  const newNode = req.body;

  console.log(`Onboarding new node: ${newNode.nodeAddress}`);

  // prepare current node list for transport
  const neighbours = nodes.map(node => ({
    nodeId: node.nodeId,
    address: node.nodeAddress.io.uri
  }));

  // save the onboarding node to the list
  nodes.push({
    nodeId: newNode.nodeId,
    nodeAddress: clientIo(`ws://${newNode.nodeAddress}`)
  });

  console.log(`New node onboarded: ${newNode.nodeAddress}`);

  res.json({ neighbours });
});

app.post('/heartbeat', (req, res) => {
  console.log(`Received heartbeat from node: ${req.body.nodeId}`);

  res.sendStatus(200);
});

//
// END OF COORDINATOR TASKS
//

const sendHeartbeatToDirector = async () => {
  if (isCoordinator) {
    try {
      await axios.post(`${DIRECTOR_URL}/register_leader`, {
        coordinatorId,
        leaderAddress: coordinatorAddress,
        leaderPublicAddress: coordinatorPublicAddress,
      })
      console.log("Heartbeat sent to Director")
    } catch (error) {
      console.error("Error sending heartbeat to Director:", error.message)
      isCoordinator = false
      initiateElection(nodeId, nodes, coordinator, registerWithDirector)
    }
  }
}

const registerWithDirector = async () => {
  // node discovery via Node Director
  try {
    const newNode = {
      nodeId,
      nodeAddress: NODE_HOST,
    }
    const response = await axios.post(`http://${DIRECTOR_URL}/join_chat`, newNode)
    const coordinator = response.data.coordinator

    console.log("Registered with Node Director")

    // check whether I'm the coordinator
    isCoordinator = nodeId === coordinator.nodeId
    // save the coordinator information
    coordinatorId = coordinator.nodeId
    coordinatorAddress = coordinator.nodeAddress

    // if I'm not the coordinator, onboard with the coordinator
    if (!isCoordinator) {
      const response = await axios.post(`http://${coordinatorAddress}/onboard_node`, newNode);
      const neighbours = response.data.neighbours;

      // save the neighbours
      neighbours.forEach(neighbour => {
        nodes.push({
          nodeId: neighbour.nodeId,
          nodeAddress: clientIo(`ws://${neighbour.nodeAddress}`)
        })
      });
    }
  } catch (error) {
    console.error("Error registering with director:", error.message)
  }
}

const sendNewMessage = async (message) => {
  // Increment the local vector clock
  vectorClock[nodeId] = (vectorClock[nodeId]) + 1;
  const newMessage = { id, nodeId, vector_clock: vectorClock, message, timestamp: Date.now() };
  // Save the message for further processing
  // handleNewMessage should work for both receiving and sending messages.
  let discussion = handleNewMessage(vectorClock, newMessage)
   // Broadcast the message to all other nodes
  for (let node of nodes) {
    if (node.nodeId != nodeId) {
    node.address.emit('message', newMessage);
    }
  }
}

if (isCoordinator) {
  sendHeartbeatToDirector()
}

registerWithDirector()
//
//setInterval(sendHeartbeatToDirector, 5000)

// HEARBEATS 
// GLOBAL VARIABLES (IN FUTURE CAN BE MOVED TO ENVIRONMENTAL VARIABLES)
// variable to indicate how many heartbeats can be missed before initiating an election
const maxMissedHeartbeats = 2;
// variable to indicate the T time in milliseconds for the heartbeat
const heartbeatInterval = 5000;
// each node excluding coordinator sends a heartbeat to the coordinator 
// in a random interval within T-2T seconds, like in RAFT algorithm. 
// If responses to two consecutive heartbeats are not received, 
// the coordinator is considered dead and an election is initiated
// Randomize the heartbeat interval for each node within the range of T-2T milliseconds
const thisNodesHeartbeatInterval = Math.floor(Math.random() * heartbeatInterval) + heartbeatInterval;

// Global counter for missed heartbeats
let missedHeartbeats = 0;
// Use axios to send a heartbeat to the coordinator
// if response is 200 OK, reset the missedHeartbeats counter
const sendHeartbeatToCoordinator = async () => {
  if (!isCoordinator) {
    try {
      // send a GET request to the coordinator's heartbeat endpoint
      const response = await axios.get(`http://${coordinatorAddress}/heartbeat`)
      if (response.status === 200) {
        // reset the missedHeartbeats counter
        missedHeartbeats = 0;
      } else {
        // increment the missedHeartbeats counter
        missedHeartbeats++;
      }
    } catch (error) {
      // in case of an error, increment the missedHeartbeats counter
      missedHeartbeats++;
    }
    if (missedHeartbeats >= maxMissedHeartbeats) {
      initiateElection(nodeId, nodes, coordinator, registerWithDirector);
    }
  }
}

setInterval(sendHeartbeatToCoordinator, thisNodesHeartbeatInterval);

// Add the node itself to the list of nodes
nodes.push({
  nodeId,
  nodeAddress: clientIo(`ws://${NODE_HOST}`)
});

server.listen(PORT, () => {
  console.log(`Node service is running on port ${PORT}`)
  if (!isCoordinator) {
    // TODO initiateElection();
  }
})
