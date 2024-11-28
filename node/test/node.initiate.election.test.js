const {
    initiateElection,
    getIsCandidate,
    setIsCandidate
} = require('../election');

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');

describe('When node initiates an election', () => {
    let nodes;
    let coordinator;
    let mockRegisterWithDirector;

    beforeEach(() => {
        coordinator = null;
        neighborNode2 = { nodeId: 2, nodeAddress: { emit: jest.fn() } };
        neighborNode4 = { nodeId: 4, nodeAddress: { emit: jest.fn() } };
        nodes = [neighborNode2, neighborNode4];

        // Mock the registerWithDirector function
        mockRegisterWithDirector = jest.fn();
        setIsCandidate(false);
    });

    it('timer is set to wait responses for 3 seconds', async () => {
        thisNode = { nodeId: 5, nodeAddress: { emit: jest.fn() } };
        initiateElection(
            thisNode.nodeId,
            nodes,
            coordinator,
            mockRegisterWithDirector
        );

        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 3000);
    });

    it('node is set to be a candidate for a new coordinator', async () => {
        thisNode = { nodeId: 5, nodeAddress: { emit: jest.fn() } };

        expect(getIsCandidate()).toBe(false);
        initiateElection(
            thisNode.nodeId,
            nodes,
            coordinator,
            mockRegisterWithDirector
        );

        expect(getIsCandidate()).toBe(true);
    });

    it('node challenges only higher id nodes for the position of coordinator', async () => {
        thisNode = { nodeId: 3, nodeAddress: { emit: jest.fn() } };

        expect(getIsCandidate()).toBe(false);
        initiateElection(
            thisNode.nodeId,
            nodes,
            coordinator,
            mockRegisterWithDirector
        );

        expect(neighborNode4.nodeAddress.emit).toHaveBeenCalledTimes(1);
        expect(neighborNode2.nodeAddress.emit).toHaveBeenCalledTimes(0);
    });
});
