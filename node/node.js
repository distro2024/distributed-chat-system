const express = require("express")
const axios = require("axios")
const http = require("http")
const { v4: uuidv4 } = require("uuid")
const path = require("path")
const clientIo = require("socket.io-client"); // check naming
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

app.post("/register_node", (req, res) => {
  const { nodeId, nodeAddress, publicAddress } = req.body

  nodes.push({ nodeId, nodeAddress, publicAddress })
  console.log(
    `Leader received registration from node: ${nodeId}, internal address ${nodeAddress}, public address ${publicAddress}`
  )

  res.json({ nodes })
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
    const coordinator = await axios.post(`${DIRECTOR_URL}/register_node`, {
      nodeId,
      address: NODE_HOST,
    })
    console.log("Registered with director")

    isCoordinator = nodeId === coordinator.nodeId
    coordinatorId = coordinator.nodeId
    coordinatorAddress = coordinator.address
    
    if (!isCoordinator) {
      // TODO handle joining the chat
      // Pekka
      //handleNeighbours()
      // const node = {
      //   nodeId,
      //   address: io(),
      // }
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
setInterval(sendHeartbeatToCoordinator, );

// Global counter for missed heartbeats
let missedHeartbeats = 0;

// Use axios to send a heartbeat to the coordinator
// if response is 200 OK, reset the missedHeartbeats counter
const sendHeartbeatToCoordinator = async () => {
  try {
    const response = await axios.post(`${coordinatorAddress}/heartbeat`, {
      nodeId,
    })
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


server.listen(PORT, () => {
  console.log(`Node service is running on port ${PORT}`)
  if (!isCoordinator) {
    // TODO initiateElection();
  }
})
