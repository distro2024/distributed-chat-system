jest.mock('../election', () => ({
    ...jest.requireActual('../election'),
    initiateElection: jest.fn(),
}));

const e = require('express');
const { getIsCandidate, setIsCandidate, handleNewCoordinator, initiateElection } = require('../election');


describe('determineVotingOutcome', () => {
    let nodes;
    let mockRegisterWithDirector;
    
    beforeEach(() => {
        
        node1 = { id: 1, address: { emit: jest.fn() } };
        node2 = { id: 2, address: { emit: jest.fn() } };
        nodes = [node1, node2];
        
        // Mock the registerWithDirector function
        mockRegisterWithDirector = jest.fn();
    });

    it('a higher id node has declared itself to be a coordinator', async () => {
        setIsCandidate(true);

        const coordinator = handleNewCoordinator(1, 2, nodes, null, mockRegisterWithDirector);
        
        
        expect(coordinator.id).toBe(2);
        expect(getIsCandidate()).toBe(false);
      
      });
    
});

