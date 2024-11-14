const express = require("express")
const axios = require("axios")
const http = require("http")
const { v4: uuidv4 } = require("uuid")
const path = require("path")

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
 * NOTE: not yet implemented correctly
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
      socket.emit('election', { nodeId });
    }


  })
  // Wait for three seconds to receive votes from other nodes
  setTimeout(determineVotingOutcome, 3000)
  determineVotingOutcome()
}

/**
* NOTE: not yet implemented correctly 
* Handle an incoming election vote from another node
 * Web socket will be implemented in the future
 * @param {any} node - The node that sent the vote
 */
const submitVote = async () => {
  // listen to incoming messages to the route /vote 
  // this should be implemented with web socket in the future
  // this is just the basic idea
  app.post('/vote', (req, res) => {
    const { id } = req.body;
    // if id is in the list of nodes, this node is not a candidate anymore
    if (nodes.includes(id)) {
      isCandidate = false;
    }
  });
  
}

/**
* NOTE: not yet implemented correctly 
* Determine the outcome of the election based
 * on the selected election algorithm
 * @param {ChatNode} chatNode - The chat node instance for this client
 */
const determineVotingOutcome = async () => {
  if (isCandidate) {
    this.isCoordinator = true
    // send a message to all nodes to update their coordinator
    nodes.forEach((node) => {
      const socket = ioClient(node.nodeAddress);
      socket.emit('update-coordinator', { nodeId });
    })

  } 
}

/**
 * NOTE: not yet implemented correctly
 * Send a response to election request
 */
const sendResponse = async () => {
  // listen to incoming messages to the route /election
  // this should be implemented with web socket in the future
  // this is just the basic idea
  app.post('/election', (req, res) => {
    const { id } = req.body;
    // if id is greater than this node's id, send a response
    // NOTE: does not match the message in work-plan. WIll be fixed in the future
    res.send({ response: 'ok' });
  });
  // the node also initiates its own election
  initiateElection();
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
