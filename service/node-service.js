/**
   * Send a message to all nodes to elect a new coordinator
   * @param {ChatNode} chatNode - The chat node instance for this client
   */
callForElection(chatNode) {
    chatNode.nodes.forEach(node => {
        callForVote(node)
    })

}

/** 
 * Sends a message through a web socket to a node
 * requesting a vote for a new coordinator
 * Web socket will be implemented in the future
 * @param {any} node - The node to send the vote request to
 */
callForVote(node) {
    // Web socket implementation
    // ws.send('Election vote request')
}

/**
 * Handle an incoming election vote from another node
 * Web socket will be implemented in the future
 * @param {any} node - The node that sent the vote
 */
submitVote() {
  this.electionVotes.push(node)
}

/**
 * Determine the outcome of the election based
 * on the selected election algorithm
 * @param {ChatNode} chatNode - The chat node instance for this client
 */
determineVotingOutcome(chatNode) {
    // if this node is the new coordinator
    sendCoordinatorMessage(chatNode)


}

/**
 * Send a message to all nodes to announce the new coordinator
 * Web socket will be implemented in the future
 * @param {ChatNode} chatNode - The chat node instance for this client
 */
sendCoordinatorMessage(chatNode) {
    chatNode.nodes.forEach(node => {
        // Web socket implementation
        // ws.send('New coordinator message')
    })
}