const { determineVotingOutcome, setIsCandidate } = require('../election');

describe('When voting outcome is determined', () => {
    let thisNode;
    let nodes;
    let coordinator;
    let mockRegisterWithDirector;

    beforeEach(() => {
        coordinator = null;
        neighborNode2 = { id: 2, address: { emit: jest.fn() } };
        neighborNode3 = { id: 3, address: { emit: jest.fn() } };
        neighborNode4 = { id: 4, address: { emit: jest.fn() } };
        nodes = [
            neighborNode2,
            neighborNode3,
            neighborNode4
        ];
        
        // Mock the registerWithDirector function
        mockRegisterWithDirector = jest.fn();
    });

    it('if the node is a candidate, it is set as the new coordinator', async () => {
        thisNode = { id: 5, address: { emit: jest.fn() } };
        setIsCandidate(true);
        nodes.push(thisNode);
        coordinator = null; 
        
        coordinator = determineVotingOutcome(thisNode.id, nodes, coordinator, mockRegisterWithDirector);
        expect(coordinator.id).toBe(thisNode.id);
      
      });
    
      it('if the is not a candidate, the node is not set to be the new coordinator', async () => {
        thisNode = { id: 1, address: { emit: jest.fn() } };
        setIsCandidate(false);
        nodes.push(thisNode);
        coordinator = null; 
    
        // Call the function
        coordinator =  determineVotingOutcome(thisNode.id, nodes, coordinator, mockRegisterWithDirector);
        
        expect(coordinator).toBe(null);
      });
});

