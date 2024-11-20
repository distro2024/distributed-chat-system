const { getIsCandidate, setIsCandidate, handleIncomingVote } = require('../election');

describe('When a vote arrives from another node,', () => {
    let nodes;
    
    beforeEach(() => {
        nodes = [
            { id: 2, address: { emit: jest.fn() } },
            { id: 3, address: { emit: jest.fn() } },
        ];
        
    });

    it('if the vote is from higher id node, is candidate is set to false', async () => {
        setIsCandidate(true);

        handleIncomingVote(2, 3, nodes);
        
        
        expect(getIsCandidate()).toBe(false);
      
      });
    
});

