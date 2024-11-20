const express = require("express")
const axios = require("axios")
const http = require("http")
const { v4: uuidv4 } = require("uuid")
const path = require("path")
const io = require("socket.io-client"); // check naming
const { 
  initiateElection, 
  handleIncomingVote, 
  handleNewCoordinator, 
  sendElectionResponse } = require("./election")

const socketIo = require("socket.io");
const {handleNewMessage} = require('./handleNewMessage');

const PORT = process.env.PORT || 4000
const DIRECTOR_URL = process.env.DIRECTOR_URL || "http://localhost:3000"
const NODE_HOST = process.env.NODE_HOST || `http://localhost:${PORT}`
const PUBLIC_HOST = process.env.PUBLIC_HOST || `http://localhost:${PORT}`

// Using IS_LEADER environment variable to simulate leader election
const IS_LEADER = process.env.IS_LEADER === "true"

const app = express()
const server = http.createServer(app)
const io = socketIo(server); // initialize socket.io with the server

app.use(express.static(path.join(__dirname, "public")))
app.use(express.json())

const nodeId = uuidv4()

// For now, node1 is always the leader based on the IS_LEADER environment variable

let coordinator = null
let isCoordinator = IS_LEADER // testing
let coordinatorId = isCoordinator ? nodeId : null
let coordinatorAddress = IS_LEADER ? NODE_HOST : null
let coordinatorPublicAddress = IS_LEADER ? PUBLIC_HOST : null


// list of nodes in the network
let nodes = []
// vector clock for the consistency of the chat
let vectorClock = {nodeId: 0} // Initialize the vector clock with the current node's ID

io.on('connection', (socket) => {
  console.log('a user connected'); //remove

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

app.post("/register_node", (req, res) => {
  const { nodeId, nodeAddress, publicAddress } = req.body
  const neighbours = [...nodes] // exclude the node who is getting neighbours

  nodes.push({ nodeId, nodeAddress, publicAddress })
  console.log(
    `Leader received registration from node: ${nodeId}, internal address ${nodeAddress}, public address ${publicAddress}`
  )

  res.json({ neighbours })
})

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
  try {
    const neighbours = await axios.post(`${DIRECTOR_URL}/register_node`, {
      nodeId,
      nodeAddress: NODE_HOST,
      publicAddress: PUBLIC_HOST,
    })
    console.log("Registered with director")
    nodes = neighbours.data.neighbours; // save neighbours
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

setInterval(sendHeartbeatToDirector, 5000)

server.listen(PORT, () => {
  console.log(`Node service is running on port ${PORT}`)
  if (!isCoordinator) {
    // TODO initiateElection();
  }
})
