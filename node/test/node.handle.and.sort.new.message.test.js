const { handleNewMessage } = require('../handleNewMessage');

describe('When function handleNewMessage is invoked', () => {
  let vectorClock;
  let discussion;

  beforeEach(() => {
    vectorClock = { A: 0, B: 0, C: 0, Batman: 0, Superman: 0 }; // Initial state of the vector clock
  });

  test('it orders messages correctly by vector clock precedence', async () => {
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
      {
        id: 4,
        node_id: 'C',
        vector_clock: { C: 1 },
        message: 'Hello from C',
        timestamp: 1300,
      }
    ];

    for (const msg of messages) {
      const result = await handleNewMessage(vectorClock, msg);
      vectorClock = result.vectorClock;
      discussion = result.discussion;
    }

    // Check the final state of the vector clock
    expect(vectorClock).toEqual({ A: 2, B: 1, C: 1, Batman: 0, Superman: 0 });

    // Check the sorted discussion
    expect(discussion).toEqual([
      {
        id: 1,
        node_id: 'A',
        vectorClock: { A: 1, B: 0, C:0, Batman: 0, Superman: 0 }, // Vector clock after the first message
        message: 'Hello from A',
        timestamp: 1000,
      },
      {
        id: 2,
        node_id: 'B',
        vectorClock: { A: 1, B: 1, C:0, Batman: 0, Superman: 0 }, // Vector clock after the second message
        message: 'Hello from B',
        timestamp: 1100,
      },
      {
        id: 3,
        node_id: 'A',
        vectorClock: { A: 2, B: 1, C: 0, Batman: 0, Superman: 0 }, // Vector clock after the third message
        message: 'Follow up from A',
        timestamp: 1200,
      },
      {
        id: 4,
        node_id: 'C',
        vectorClock: { A: 2, B: 1, C: 1, Batman: 0, Superman: 0 }, // Vector clock after the fourth message
        message: 'Hello from C',
        timestamp: 1300,
      }
    ]);
  });
  test('it orders concurrent messages correctly by timestamps when vector clocks are equal', async () => {
    const messages = [
      {
        id: 5,
        node_id: 'Batman',
        vector_clock: { A: 2, B: 1, C: 1, Batman: 1, Superman: 1 },
        message: 'Either you die a hero or you live long enough to see yourself become the villain',
        timestamp: 1400,
      },
      {
        id: 6,
        node_id: 'Superman',
        vector_clock: { A: 2, B: 1, C: 1, Batman: 1, Superman: 1 },
        message: 'With great power comes great responsibility',
        timestamp: 1500,
      },
    ];
    for (const msg of messages) {
      const result = await handleNewMessage(vectorClock, msg);
      vectorClock = result.vectorClock;
      discussion = result.discussion;
    }
    expect(vectorClock).toEqual({ A: 2, B: 1, C: 1, Batman: 1, Superman: 1 });
    expect(discussion).toEqual([
      {
        id: 1,
        node_id: 'A',
        vectorClock: { A: 1, B: 0, C: 0, Batman: 0, Superman: 0 }, // Vector clock after the first message
        message: 'Hello from A',
        timestamp: 1000,
      },
      {
        id: 2,
        node_id: 'B',
        vectorClock: { A: 1, B: 1, C: 0, Batman: 0, Superman: 0 }, // Vector clock after the second message
        message: 'Hello from B',
        timestamp: 1100,
      },
      {
        id: 3,
        node_id: 'A',
        vectorClock: { A: 2, B: 1, C: 0, Batman: 0, Superman: 0 }, // Vector clock after the third message
        message: 'Follow up from A',
        timestamp: 1200,
      },
      {
        id: 4,
        node_id: 'C',
        vectorClock: { A: 2, B: 1, C: 1, Batman: 0, Superman: 0 }, // Vector clock after the fourth message
        message: 'Hello from C',
        timestamp: 1300,
      },
      {
        id: 5,
        node_id: 'Batman',
        vectorClock: { A: 2, B: 1, C: 1, Batman: 1, Superman: 1 }, // Vector clock after the fifth message
        message: 'Either you die a hero or you live long enough to see yourself become the villain',
        timestamp: 1400,
      },
      {
        id: 6,
        node_id: 'Superman',
        vectorClock: { A: 2, B: 1, C: 1, Batman: 1, Superman: 1 }, // Vector clock after the sixth message
        message: 'With great power comes great responsibility',
        timestamp: 1500,
      },
    ]);
  });
});
