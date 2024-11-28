const {
    getIsCandidate,
    setIsCandidate,
    handleIncomingVote
} = require('../election');

describe('When a vote arrives from another node,', () => {
    let nodes;

    beforeEach(() => {
        nodes = [
            { nodeId: 2, nodeAddress: { emit: jest.fn() } },
            { nodeId: 3, nodeAddress: { emit: jest.fn() } }
        ];
    });

    it('if the vote is from higher id node, is candidate is set to false', async () => {
        setIsCandidate(true);

        handleIncomingVote(2, 3, nodes);

        expect(getIsCandidate()).toBe(false);
    });
});
