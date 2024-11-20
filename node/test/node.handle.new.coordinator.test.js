const { getIsCandidate, setIsCandidate, handleNewCoordinator } = require('../election');


describe('When a new coordinator has been elected', () => {
    let nodes;
    let mockRegisterWithDirector;
    
    beforeEach(() => {
        
        node1 = { id: 1, address: { emit: jest.fn() } };
        node2 = { id: 2, address: { emit: jest.fn() } };
        nodes = [node1, node2];
        
        // Mock the registerWithDirector function
        mockRegisterWithDirector = jest.fn();
    });

    it('if a higher id node declares itself to be a coordinator, accept', async () => {
        setIsCandidate(true);

        const coordinator = handleNewCoordinator(1, 2, nodes, null, mockRegisterWithDirector);
        
        
        expect(coordinator.id).toBe(2);
        expect(getIsCandidate()).toBe(false);
      
      });
    
});

