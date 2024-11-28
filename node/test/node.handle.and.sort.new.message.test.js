const { handleNewMessage } = require('../handleNewMessage');

describe('When function handleNewMessage is invoked', () => {
    let vectorClock = {};
    it('messages should be correctly ordered based on vector clocks and timestamps', () => {
        let result = handleNewMessage(vectorClock, {
            id: '1',
            nodeId: 'A',
            vectorClock: { A: 1 },
            message: 'Hello from A',
            timestamp: 1000
        });
        vectorClock = result.vectorClock;

        result = handleNewMessage(vectorClock, {
            id: '2',
            nodeId: 'B',
            vectorClock: { B: 1 },
            message: 'Hello from B',
            timestamp: 1005
        });
        vectorClock = result.vectorClock;

        result = handleNewMessage(vectorClock, {
            id: '3',
            nodeId: 'A',
            vectorClock: { A: 2 },
            message: 'Another message from A',
            timestamp: 1010
        });
        vectorClock = result.vectorClock;

        result = handleNewMessage(vectorClock, {
            id: '4',
            nodeId: 'B',
            vectorClock: { B: 2 },
            message: 'Another message from B',
            timestamp: 1008
        });
        vectorClock = result.vectorClock;

        expect(result.discussion.map((m) => m.id)).toEqual([
            '1',
            '2',
            '4',
            '3'
        ]);
    });

    it('concurrent messages with the same vector clock should be handled correctly', () => {
        result = handleNewMessage(vectorClock, {
            id: '5',
            nodeId: 'B',
            vectorClock: { B: 3 },
            message: 'Another message from B',
            timestamp: 2005
        });
        vectorClock = result.vectorClock;

        result = handleNewMessage(vectorClock, {
            id: '6',
            nodeId: 'A',
            vectorClock: { A: 3 },
            message: 'Another message from A',
            timestamp: 2002
        });
        vectorClock = result.vectorClock;

        expect(result.discussion.map((m) => m.id)).toEqual([
            '1',
            '2',
            '4',
            '3',
            '6',
            '5'
        ]);
    });

    it('duplicate messages should be ignored', () => {
        let result = handleNewMessage(vectorClock, {
            id: '7',
            nodeId: 'A',
            vectorClock: { A: 4 },
            message: 'Hello from A',
            timestamp: 3000
        });
        vectorClock = result.vectorClock;

        result = handleNewMessage(vectorClock, {
            id: '7',
            nodeId: 'A',
            vectorClock: { A: 4 },
            message: 'Hello from A',
            timestamp: 3000
        });
        vectorClock = result.vectorClock;

        expect(result.discussion.length).toBe(7);
    });

    it('missing keys should be initialized in the received vector clock', () => {
        let vectorClock = { A: 5 };

        const result = handleNewMessage(vectorClock, {
            id: '8',
            nodeId: 'B',
            vectorClock: { B: 4, C: 1 },
            message: 'Hello from B',
            timestamp: 7000
        });

        expect(result.vectorClock).toEqual({ A: 5, B: 4, C: 1 });
    });
});
