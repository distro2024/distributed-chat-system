let isCandidate = false;


/**
 * Send a message to all nodes to elect a new coordinator
 * @param {*} nodeId the id of the node initiating the election
 * @param {*} nodes a list of all nodes in the network
 * @param {*} coordinator the current coordinator
 */
const initiateElection = (nodeId, nodes, coordinator, registerWithDirector) => {
    isCandidate = true;
    nodes.forEach((node) => {
      // Sends a message through a web socket to a node
      // requesting a vote for a new coordinator
      if (node.nodeId > nodeId) {
        node.address.emit('election', nodeId);
      }
  
    })
    // Wait for three seconds to receive votes from other nodes
    setTimeout(determineVotingOutcome, 3000)
    determineVotingOutcome(nodeId, nodes, coordinator, registerWithDirector)
}
  
/**
 * Determine the outcome of the election
 * @param {*} nodeId the id of this node
 * @param {*} isCandidate boolean indicating if this node is a candidate
 * @param {*} nodes a list of all nodes in the network
 * @param {*} coordinator coordinator of the network
 */
const determineVotingOutcome = (nodeId, nodes, coordinator, registerWithDirector) => {
    if (isCandidate) {
        // set this node as the new coordinator
        coordinator = nodes.find(node => node.nodeId === nodeId)
        // send a message to all nodes to update their coordinator
        nodes.forEach((node) => {
            if (node.id != nodeId) {
                node.address.emit('update-coordinator', { nodeId });
            }
        })
        // send a message to the director to update the coordinator
        registerWithDirector()
    } 
}

/**
 * Handle an incoming election vote from another node
 * @param {any} voterId - The node that sent the vote
 * @param {any} nodes - A list of all nodes in the network
 */
const handleIncomingVote = (voterId, nodes) => {
    if (nodes.includes(voterId) && voterId > nodeId) {
        isCandidate = false;
    }
}

/**
 * A node has elected itself as the new coordinator. Update the
 * Coordinator information. If this node has higher id, challenge
 * the new coordinator
 * @param {*} nodeId id of the node 
 * @param {*} newCoordinatorId id of the new coordinator
 * @param {*} nodes A list of all nodes in the network
 * @param {*} coordinator The current coordinator
 * @param {*} registerWithDirector Function to register with the Node Director
 */
const handleNewCoordinator = (nodeId, newCoordinatorId, nodes, coordinator, registerWithDirector) => {
// If the new coordinator has a higher id relinquish coordinator status
// Else challenge the new coordinator
    if (newCoordinatorId > nodeId) {
        isCoordinator = false;
        coordinatorId = newCoordinatorId;
        coordinatorAddress = nodes.find(node => node.nodeId === newCoordinatorId).nodeAddress;
    } else {
        initiateElection(nodeId, nodes, coordinator, registerWithDirector);
    }
}

/**
 * Send a response to an incoming election request and
 * become a candidate by initiating an election 
 * @param {*} nodeId id of the node
 * @param {*} nodes A list of all nodes in the network
 * @param {*} candidateId id of the candidate
 * @param {*} coordinator The current coordinator
 * @param {*} registerWithDirector Function to register with the Node Director
 */
const sendElectionResponse = async (nodeId, nodes, candidateId, coordinator, registerWithDirector) => {
    candidateId.address.emit('submit-vote', nodeId);
    initiateElection(nodeId, nodes, coordinator, registerWithDirector);
}


module.exports  = { initiateElection, determineVotingOutcome, handleIncomingVote, handleNewCoordinator, sendElectionResponse }