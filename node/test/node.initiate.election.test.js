const { initiateElection, getIsCandidate, setIsCandidate } = require('../election');

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');


describe('determineVotingOutcome', () => {
    let chatNode;
    let nodes;
    let coordinator;
    let mockRegisterWithDirector;

    beforeEach(() => {
        coordinator = null;
        neighborNode2 = { id: 2, address: { emit: jest.fn() } };
        neighborNode4 = { id: 4, address: { emit: jest.fn() } };
        nodes = [
            neighborNode2,
            neighborNode4
        ];
        
        // Mock the registerWithDirector function
        mockRegisterWithDirector = jest.fn();
        setIsCandidate(false);
    });

    it('timer waits for 3 seconds', async () => {
        thisNode = { id: 5, address: { emit: jest.fn() } };
        initiateElection(thisNode.id, nodes, coordinator, mockRegisterWithDirector);

        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 3000);
    });
    

    it('isCandidate is set to true', async () => {
        thisNode = { id: 5, address: { emit: jest.fn() } };
        
        expect(getIsCandidate()).toBe(false);
        initiateElection(thisNode.id, nodes, coordinator, mockRegisterWithDirector);

        expect(getIsCandidate()).toBe(true);
    });

    it('only nodes with higher id are challenged', async () => {
        thisNode = { id: 3, address: { emit: jest.fn() } };
        
        expect(getIsCandidate()).toBe(false);
        initiateElection(thisNode.id, nodes, coordinator, mockRegisterWithDirector);

        expect(neighborNode4.address.emit).toHaveBeenCalledTimes(1);
        expect(neighborNode2.address.emit).toHaveBeenCalledTimes(0);
    });


});

