const { initiateElection, getIsCandidate, setIsCandidate } = require('../election');

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');

describe('When node initiates an election', () => {
    let nodes;
    let coordinator;
    let mockSetAsCoordinator;

    beforeEach(() => {
        coordinator = null;
        neighborNode2 = { nodeId: 2, socket: { emit: jest.fn() } };
        neighborNode4 = { nodeId: 4, socket: { emit: jest.fn() } };
        nodes = [neighborNode2, neighborNode4];

        // Mock the setAsCoordinator function
        mockSetAsCoordinator = jest.fn();
        setIsCandidate(false);
    });

    it('timer is set to wait responses for 3 seconds', async () => {
        thisNode = { nodeId: 5, socket: { emit: jest.fn() } };
        initiateElection(thisNode.nodeId, nodes, coordinator, mockSetAsCoordinator);

        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 3000);
    });

    it('node is set to be a candidate for a new coordinator', async () => {
        thisNode = { nodeId: 5, socket: { emit: jest.fn() } };

        expect(getIsCandidate()).toBe(false);
        initiateElection(thisNode.nodeId, nodes, coordinator, mockSetAsCoordinator);

        expect(getIsCandidate()).toBe(true);
    });

    it('node challenges only higher id nodes for the position of coordinator', async () => {
        thisNode = { nodeId: 3, socket: { emit: jest.fn() } };

        expect(getIsCandidate()).toBe(false);
        initiateElection(thisNode.nodeId, nodes, coordinator, mockSetAsCoordinator);

        expect(neighborNode4.socket.emit).toHaveBeenCalledTimes(1);
        expect(neighborNode2.socket.emit).toHaveBeenCalledTimes(0);
    });
});
