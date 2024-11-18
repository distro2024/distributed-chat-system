const { determineVotingOutcome } = require('../election');

describe('determineVotingOutcome', () => {
    let nodeId;
    let nodes;
    let coordinator;
    let mockRegisterWithDirector;
    let isCandidate;

    beforeEach(() => {
        coordinator = null;
        nodes = [
            { id: 2, address: { emit: jest.fn() } },
            { id: 3, address: { emit: jest.fn() } },
        ];
        
        // Mock the registerWithDirector function
        mockRegisterWithDirector = jest.fn();
        isCandidate = true;
    });

    it('node is Set as coordinator', async () => {
        nodeId = 4;
        await determineVotingOutcome(nodeId, isCandidate, nodes, coordinator, mockRegisterWithDirector);
    
        // Verify `emit` is called for each node
        nodes.forEach((node) => {
          expect(node.address.emit).toHaveBeenCalledWith('update-coordinator', { nodeId });
        });
    
        // Verify registerWithDirector is called
        expect(mockRegisterWithDirector).toHaveBeenCalled();
      });
    
      it('node is not the new coordinator', async () => {
        nodeId = 1;
        isCandidate = false;
    
        // Call the function
        await determineVotingOutcome(nodeId, isCandidate, nodes, coordinator, mockRegisterWithDirector);
    
        // Verify `emit` is not called
        nodes.forEach((node) => {
          expect(node.address.emit).not.toHaveBeenCalled();
        });
    
        // Verify registerWithDirector is not called
        expect(mockRegisterWithDirector).not.toHaveBeenCalled();
      });
});

