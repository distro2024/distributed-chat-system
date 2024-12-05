const log = require('./constants').log;

let isCandidate = false;

/**
 * Send a message to all nodes to elect a new coordinator
 * @param {*} thisNodeId the id of the node initiating the election
 * @param {*} nodes a list of all nodes in the network
 * @param {*} coordinator the id and address of the current coordinator
 * @param {*} setAsCoordinator function to set this node as the coordinator
 */
const initiateElection = (thisNodeId, nodes, coordinator, setAsCoordinator) => {
    console.log(`${log.ELECTION} Initiating election`);
    isCandidate = true;
    nodes.forEach((node) => {
        // Sends a message through a web socket to a node
        // requesting a vote for a new coordinator
        if (node.nodeId > thisNodeId) {
            try {
                console.log(`${log.ELECTION} Sending election request to node:, ${node.nodeId}`);
                node.socket.emit('election', thisNodeId);
            } catch (error) {
                console.log(`${log.ELECTION} ${log.ERROR} Error sending election request to node: ${node.nodeAddress}, error: ${error}`);
            }
        }
    });
    // Wait for three seconds to receive votes from other nodes
    return new Promise((resolve) => {
        setTimeout(() => {
            coordinator = determineVotingOutcome(thisNodeId, nodes, coordinator, setAsCoordinator);
            resolve(coordinator);
        }, 3000);
    });
};

/**
 * Determine the outcome of the election
 * @param {*} thisNodeId the id of this node
 * @param {*} nodes a list of all nodes in the network
 * @param {*} coordinator id and the address of the coordinator
 * @param {*} setAsCoordinator function to set this node as the coordinator
 */
const determineVotingOutcome = (thisNodeId, nodes, coordinator, setAsCoordinator) => {
    console.log(`${log.ELECTION} Determine voting outcome. isCandidate: ${isCandidate}`);
    if (isCandidate) {
        // send a message to the director to update the coordinator
        setAsCoordinator();
        // set this node as the new coordinator
        coordinator = nodes.find((node) => node.nodeId === thisNodeId);
        // send a message to all nodes to update their coordinator
        nodes.forEach((node) => {
            if (node.nodeId !== thisNodeId && node.socket) {
                try {
                    console.log(`${log.ELECTION} Sending coordinator update to node:, ${node.nodeAddress}`);
                    node.socket.emit('update-coordinator', thisNodeId);
                } catch (error) {
                    console.log(`${log.ELECTION} Error sending coordinator update to node: ${node.nodeAddress}, error: ${error}`);
                }
            }
        });
    }

    return coordinator;
};

/**
 * Handle an incoming election vote from another node
 * @param {any} thisNodeId - the id of the node
 * @param {any} voterId - The node that sent the vote
 * @param {any} nodes - A list of all nodes in the network
 */
const handleIncomingVote = (thisNodeId, voterId, nodes) => {
    console.log(`${log.ELECTION} Received vote from node: ${voterId}`);
    const nodeExists = nodes.some((node) => node.nodeId === voterId);
    if (nodeExists && voterId > thisNodeId) {
        console.log(`${log.ELECTION} Vote verified, stepping down as candidate, voter: ${nodes.find((node) => node.nodeId === voterId).nodeAddress}`);
        isCandidate = false;
    }
};

/**
 * A node has elected itself as the new coordinator. Update the
 * Coordinator information. If this node has higher id, challenge
 * the new coordinator
 * @param {*} thisNodeId id of the node
 * @param {*} newCoordinatorId id of the new coordinator
 * @param {*} nodes A list of all nodes in the network
 * @param {*} coordinator The current coordinator
 * @param {*} registerWithDirector Function to register with the Node Director
 */
const handleNewCoordinator = (thisNodeId, newCoordinatorId, nodes, coordinator, registerWithDirector) => {
    // If the new coordinator has a higher id relinquish coordinator status
    // Else challenge the new coordinator

    try {
        const nodeExists = nodes.some((node) => node.nodeId === newCoordinatorId);
        if (nodeExists && newCoordinatorId > thisNodeId) {
            isCandidate = false;
            coordinator = nodes.find((node) => node.nodeId === newCoordinatorId);
            console.log(`${log.ELECTION} New coordinator successfully resolved:' ${coordinator.nodeAddress}`);
        } else {
            coordinator = initiateElection(thisNodeId, nodes, coordinator, registerWithDirector);
        }
    } catch (error) {
        console.log(`${log.ELECTION} ${log.ERROR} Error resolving new coordinator: ${error}`);
    }

    return coordinator;
};

/**
 * Send a response to an incoming election request and
 * become a candidate by initiating an election
 * @param {*} thisNodeId id of the node
 * @param {*} nodes A list of all nodes in the network
 * @param {*} candidateId id of the candidate
 * @param {*} coordinator The current coordinator
 * @param {*} registerWithDirector Function to register with the Node Director
 */
const sendElectionResponse = async (thisNodeId, nodes, candidateId, coordinator, registerWithDirector) => {
    console.log(`${log.ELECTION} Sending election response to candidate: ${candidateId}`);
    let candidate = nodes.find((node) => node.nodeId === candidateId);
    try {
        candidate.socket.emit('vote', thisNodeId);
    } catch (error) {
        console.log(`${log.ELECTION} ${log.ERROR} Error sending vote to candidateId: ${candidateId}, error: ${error}`);
    }
    return initiateElection(thisNodeId, nodes, coordinator, registerWithDirector);
};

/**
 * This helper function is used in this PoC to unittest this application
 * In a more robust application mocking or spying on this function would be
 *  more appropriate
 * @param {*} value set the boolean value of isCandidate
 */
const setIsCandidate = (value) => {
    isCandidate = value;
};

/**
 * Another helper function used for testing
 * @returns the value of isCandidate
 */
const getIsCandidate = () => {
    return isCandidate;
};

module.exports = {
    getIsCandidate,
    setIsCandidate,
    initiateElection,
    determineVotingOutcome,
    handleIncomingVote,
    handleNewCoordinator,
    sendElectionResponse
};
