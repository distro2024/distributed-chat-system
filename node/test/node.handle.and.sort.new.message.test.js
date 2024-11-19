const { handleNewMessage } = require('../handleNewMessage');

describe('Message Handling', () => {
  let vectorClock;
  let discussion;

  beforeEach(() => {
    vectorClock = { A: 0, B: 0 }; // Initial state of the vector clock
    discussion = []; // Clear the discussion array before each test
  });

  test('handleNewMessage processes and sorts messages correctly', async () => {
    const messages = [
      {
        id: 1,
        node_id: 'A',
        vector_clock: { A: 1 },
        message: 'Hello from A',
        timestamp: 1000,
      },
      {
        id: 2,
        node_id: 'B',
        vector_clock: { B: 1 },
        message: 'Hello from B',
        timestamp: 1100,
      },
      {
        id: 3,
        node_id: 'A',
        vector_clock: { A: 2, B: 1 },
        message: 'Follow up from A',
        timestamp: 1200,
      },
    ];

    for (const msg of messages) {
      const result = await handleNewMessage(vectorClock, msg);
      vectorClock = result.vectorClock;
      discussion = result.discussion;
    }

    // Check the final state of the vector clock
    expect(vectorClock).toEqual({ A: 2, B: 1 });

    // Check the sorted discussion
    expect(discussion).toEqual([
      {
        id: 1,
        node_id: 'A',
        vectorClock: { A: 1, B: 0 }, // Vector clock after the first message
        message: 'Hello from A',
        timestamp: 1000,
      },
      {
        id: 2,
        node_id: 'B',
        vectorClock: { A: 1, B: 1 }, // Vector clock after the second message
        message: 'Hello from B',
        timestamp: 1100,
      },
      {
        id: 3,
        node_id: 'A',
        vectorClock: { A: 2, B: 1 }, // Vector clock after the third message
        message: 'Follow up from A',
        timestamp: 1200,
      },
    ]);
  });
});


