const { initiateElection, getIsCandidate, setIsCandidate } = require('../election');

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');


describe('When node initiates an election', () => {
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

    it('timer is set to wait responses for 3 seconds', async () => {
        thisNode = { id: 5, address: { emit: jest.fn() } };
        initiateElection(thisNode.id, nodes, coordinator, mockRegisterWithDirector);

        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 3000);
    });
    

    it('node is set to be a candidate for a new coordinator', async () => {
        thisNode = { id: 5, address: { emit: jest.fn() } };
        
        expect(getIsCandidate()).toBe(false);
        initiateElection(thisNode.id, nodes, coordinator, mockRegisterWithDirector);

        expect(getIsCandidate()).toBe(true);
    });

    it('node challenges only higher id nodes for the position of coordinator', async () => {
        thisNode = { id: 3, address: { emit: jest.fn() } };
        
        expect(getIsCandidate()).toBe(false);
        initiateElection(thisNode.id, nodes, coordinator, mockRegisterWithDirector);

        expect(neighborNode4.address.emit).toHaveBeenCalledTimes(1);
        expect(neighborNode2.address.emit).toHaveBeenCalledTimes(0);
    });


});

