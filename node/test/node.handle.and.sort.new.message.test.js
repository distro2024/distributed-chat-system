const { handleNewMessage } = require('../handleNewMessage');

describe('Message Handling', () => {
  let vectorClock;
  let discussion;

  beforeEach(() => {
    // Initialize vectorClock with specific initial values
    vectorClock = { A: 0, B: 0 }; // Assuming nodes A and B should start with a clock of 0
    discussion = [];
  });

  test('handleNewMessage processes and sorts messages correctly', async () => {
    const messages = [
      {
        id: 1,
        node_id: 'A',
        vector_clock: { A: 1 },
        message: 'Hello from A',
        timestamp: 1000
      },
      {
        id: 2,
        node_id: 'B',
        vector_clock: { B: 1 },
        message: 'Hello from B',
        timestamp: 1100
      },
      {
        id: 3,
        node_id: 'A',
        vector_clock: { A: 2, B: 1 },
        message: 'Follow up from A',
        timestamp: 1200
      }
    ];

    // Simulate receiving and processing each message
    for (const msg of messages) {
      const result = await handleNewMessage(vectorClock, msg);
      vectorClock = result.vectorClock;
      discussion = result.discussion;
    }

    // Test vector clock updates
    expect(vectorClock).toEqual({ A: 2, B: 1 });

    // Test discussion sort order
    expect(discussion).toEqual([
      {
        message: 'Hello from A',
        timestamp: 1000,
        vectorClock: { A: 1, B: 0 }
      },
      {
        message: 'Hello from B',
        timestamp: 1100,
        vectorClock: { A: 1, B: 1 }
      },
      {
        message: 'Follow up from A',
        timestamp: 1200,
        vectorClock: { A: 2, B: 1 }
      }
    ]);
  });
});

