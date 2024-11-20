const { getIsCandidate, setIsCandidate, handleIncomingVote } = require('../election');

describe('determineVotingOutcome', () => {
    let nodes;
    
    beforeEach(() => {
        nodes = [
            { id: 2, address: { emit: jest.fn() } },
            { id: 3, address: { emit: jest.fn() } },
        ];
        
    });

    it('incoming vote from higher id node in the network sets is candidate to false', async () => {
        setIsCandidate(true);

        handleIncomingVote(2, 3, nodes);
        
        
        expect(getIsCandidate()).toBe(false);
      
      });
    
});

