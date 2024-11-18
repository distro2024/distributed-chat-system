const express = require("express")
const axios = require("axios")
const http = require("http")
const { v4: uuidv4 } = require("uuid")
const path = require("path")
const io = require("socket.io-client"); // check naming

const PORT = process.env.PORT || 4000
const DIRECTOR_URL = process.env.DIRECTOR_URL || "http://localhost:3000"
const NODE_HOST = process.env.NODE_HOST || `http://localhost:${PORT}`
const PUBLIC_HOST = process.env.PUBLIC_HOST || `http://localhost:${PORT}`

// Using IS_LEADER environment variable to simulate leader election
const IS_LEADER = process.env.IS_LEADER === "true"

const app = express()
const server = http.createServer(app)

app.use(express.static(path.join(__dirname, "public")))
app.use(express.json())

const nodeId = uuidv4()

// For now, node1 is always the leader based on the IS_LEADER environment variable

let coordinator = null
let isCoordinator = IS_LEADER // testing
let coordinatorId = isCoordinator ? nodeId : null
let coordinatorAddress = IS_LEADER ? NODE_HOST : null
let coordinatorPublicAddress = IS_LEADER ? PUBLIC_HOST : null

// when an election is initiated, this node becomes a candidate
// if it receives an OK from a higher priority node, it will not be a candidate anymore
let isCandidate = false


// list of nodes in the network
let nodes = []
// list of chat-messages in the network
let discussion = []


io.on('connection', (socket) => {
  console.log('a user connected'); //remove

  socket.on('message', (msg) => {
    console.log(`Received message: ${msg}`); //remove
    handleNewMessage(msg); //To be implemented, see handleNewMessages() below
  });


  // Incoming requests regarding election process
  // A vote is received from another node
  socket.on('vote', (voterId) => {
    console.log(`Received vote from ${voterId}`); //remove
    handleIncomingVote(voterId);
  });
  // A new coordinator is elected
  socket.on('update-coordinator', (newCoordinatorId) => {
    console.log(`Received new coordinator: ${newCoordinatorId}`); // remove
    handleNewCoordinator(newCoordinatorId);
  });
  // An election request is received
  socket.on('election', (coordinatorCandidateId) => {
    console.log(`Received election request`); // remove
    sendElectionResponse(coordinatorCandidateId);
  });
});

app.post("/register_node", (req, res) => {
  const { nodeId, nodeAddress, publicAddress } = req.body
  nodes.push({ nodeId, nodeAddress, publicAddress })
  console.log(
    `Leader received registration from node: ${nodeId}, internal address ${nodeAddress}, public address ${publicAddress}`
  )
  res.sendStatus(200)
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
      initiateElection()
    }
  }
}

const registerWithDirector = async () => {
  try {
    await axios.post(`${DIRECTOR_URL}/register_node`, {
      nodeId,
      nodeAddress: NODE_HOST,
      publicAddress: PUBLIC_HOST,
    })
    console.log("Registered with director")
  } catch (error) {
    console.error("Error registering with director:", error.message)
  }
}

/**
 * Send a message to all nodes to elect a new coordinator
 * @param {ChatNode} chatNode - The chat node instance for this client
 */
const initiateElection = async () => {
  isCandidate = true
  nodes.forEach((node) => {
    // Sends a message through a web socket to a node
    // requesting a vote for a new coordinator
    if (node.nodeId > nodeId) {
      const socket = ioClient(node.nodeAddress);
      node.address.emit('election', nodeId);
    }

  })
  // Wait for three seconds to receive votes from other nodes
  setTimeout(determineVotingOutcome, 3000)
  determineVotingOutcome()
}

/**
* Determine the outcome of the election based
 * on the selected election algorithm
 * @param {ChatNode} chatNode - The chat node instance for this client
 */
const determineVotingOutcome = async () => {
  if (isCandidate) {
    this.isCoordinator = true
    // send a message to all nodes to update their coordinator
    nodes.forEach((node) => {
      node.address.emit('update-coordinator', { nodeId });
    })
    // send a message to the director to update the coordinator
    registerWithDirector()
  } 
}

/**
* Handle an incoming election vote from another node
* @param {any} voterId - The node that sent the vote
*/
const handleIncomingVote = (voterId) => {
  if (nodes.includes(voterId) && voterId > nodeId) {
    isCandidate = false;
  }
}


const handleNewCoordinator = (newCoordinatorId) => {
  coordinatorId = newCoordinatorId;
  coordinatorAddress = nodes.find(node => node.nodeId === newCoordinatorId).nodeAddress;
  
  // If this node is coordinator, but current node has a higher id
  // relinquish coordinator status. Else challenge the new coordinator
  if (isCoordinator && newCoordinatorId > nodeId) {
    isCoordinator = false;
  } else {
    initiateElection();
  }
}

/**
 * Send a response to an incoming election request and
 * initiate an election 
 */
const sendElectionResponse = async (candidateId) => {
  candidateId.address.emit('submit-vote', nodeId);
  initiateElection();
}


const handleNewMessage = (msg) => {
  // TODO: handle messages sorting etc
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
