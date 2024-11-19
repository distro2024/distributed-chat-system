const e = require('express');
const { setIsCandidate, determineVotingOutcome } = require('../election');

describe('determineVotingOutcome', () => {
    let chatNode;
    let nodes;
    let coordinator;
    let mockRegisterWithDirector;

    beforeEach(() => {
        coordinator = null;
        nodes = [
            { id: 2, address: { emit: jest.fn() } },
            { id: 3, address: { emit: jest.fn() } },
        ];
        
        // Mock the registerWithDirector function
        mockRegisterWithDirector = jest.fn();
    });

    it('node is Set as the new coordinator', async () => {
        chatNode = { id: 4, address: { emit: jest.fn() } };
        setIsCandidate(true);
        nodes.push(chatNode);
        coordinator = null; 
        
        coordinator = determineVotingOutcome(chatNode.id, nodes, coordinator, mockRegisterWithDirector);
        expect(coordinator.id).toBe(chatNode.id);
      
      });
    
      it('node is note set to be the new coordinator', async () => {
        chatNode = { id: 1, address: { emit: jest.fn() } };
        setIsCandidate(false);
        nodes.push(chatNode);
        coordinator = null; 
    
        // Call the function
        coordinator =  determineVotingOutcome(chatNode.id, nodes, coordinator, mockRegisterWithDirector);
        
        expect(coordinator).toBe(null);
      });
});

