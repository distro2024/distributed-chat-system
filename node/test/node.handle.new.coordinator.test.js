const { getIsCandidate, setIsCandidate, handleNewCoordinator } = require('../election');


describe('When a new coordinator has been elected', () => {
    let nodes;
    let mockRegisterWithDirector;
    
    beforeEach(() => {
        
        const node1 = { nodeId: 1, nodeAddress: { emit: jest.fn() } };
        const node2 = { nodeId: 2, nodeAddress: { emit: jest.fn() } };
        nodes = [node1, node2];
        
        // Mock the registerWithDirector function
        mockRegisterWithDirector = jest.fn();
    });

    it('if a higher id node declares itself to be a coordinator, accept', async () => {
        setIsCandidate(true);

        const coordinator = handleNewCoordinator(1, 2, nodes, null, mockRegisterWithDirector);
        
        
        expect(coordinator.nodeId).toBe(2);
        expect(getIsCandidate()).toBe(false);
      
      });
    
});

