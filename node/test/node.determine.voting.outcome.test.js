const { determineVotingOutcome, setIsCandidate } = require('../election');

describe('When voting outcome is determined', () => {
    let thisNode;
    let nodes;
    let coordinator;
    let mockRegisterWithDirector;

    beforeEach(() => {
        coordinator = null;
        neighborNode2 = { nodeId: 2, nodeAddress: { emit: jest.fn() } };
        neighborNode3 = { nodeId: 3, nodeAddress: { emit: jest.fn() } };
        neighborNode4 = { nodeId: 4, nodeAddress: { emit: jest.fn() } };
        nodes = [neighborNode2, neighborNode3, neighborNode4];

        // Mock the registerWithDirector function
        mockRegisterWithDirector = jest.fn();
    });

    it('if the node is a candidate, it is set as the new coordinator', async () => {
        thisNode = { nodeId: 5, nodeAddress: { emit: jest.fn() } };
        setIsCandidate(true);
        nodes.push(thisNode);
        coordinator = null;

        coordinator = determineVotingOutcome(
            thisNode.nodeId,
            nodes,
            coordinator,
            mockRegisterWithDirector
        );
        expect(coordinator.nodeId).toBe(thisNode.nodeId);
    });

    it('if the is not a candidate, the node is not set to be the new coordinator', async () => {
        thisNode = { nodeId: 1, nodeAddress: { emit: jest.fn() } };
        setIsCandidate(false);
        nodes.push(thisNode);
        coordinator = null;

        // Call the function
        coordinator = determineVotingOutcome(
            thisNode.nodeId,
            nodes,
            coordinator,
            mockRegisterWithDirector
        );

        expect(coordinator).toBe(null);
    });
});
