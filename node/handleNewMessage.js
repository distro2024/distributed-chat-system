const log = require('./constants').log;

// https://github.com/datastructures-js/priority-queue
const { PriorityQueue } = require('datastructures-js');
// This function sorts the messages based on their vector clocks and timestamps
const compareMessages = (a, b) => {
    console.log(`${log.INFO} Comparing messages`);
    const vcA = a.vectorClock;
    const vcB = b.vectorClock;
    const allKeys = new Set([...Object.keys(vcA), ...Object.keys(vcB)]);
    for (const key of allKeys) {
        // The loop will break immediately when a difference is found
        if (vcA[key] < vcB[key]) {
            return -1;
        } else if (vcA[key] > vcB[key]) {
            return 1;
        }
    }
    // If vector clocks are concurrent (i.e., equal), timestamps serve as tiebreakers
    return a.timestamp - b.timestamp;
};

// Initialize the priority queue with the compareMessages function as the comparator
const discussionQueue = new PriorityQueue(compareMessages);

const handleNewMessage = (vectorClock, msg) => {
    console.log(`${log.INFO} Handling new chat message`);
    const { id, nodeId: msgNodeId, nodeHost: msgNodeHost, vectorClock: msgVectorClock, message, timestamp } = msg;

    const existingMessage = discussionQueue.toArray().find((m) => m.id === id);
    if (existingMessage) {
        return {
            vectorClock,
            discussion: discussionQueue.toArray()
        };
    }

    // Ensure all keys in the received vector clock are present in the local vector clock
    for (const key in msgVectorClock) {
        if (!(key in vectorClock)) {
            vectorClock[key] = 0; // Initialize missing keys to 0
        }
    }
    // Merge the received vector clock into the local vector clock.
    for (const key in msgVectorClock) {
        vectorClock[key] = Math.max(vectorClock[key], msgVectorClock[key]);
    }

    // Extract the actual message text if necessary
    const messageText = typeof message === 'string' ? message : '';

    // Add the message to the discussion
    discussionQueue.enqueue({
        id,
        nodeId: msgNodeId,
        nodeHost: msgNodeHost,
        vectorClock: { ...msgVectorClock },
        message: messageText, // Use the extracted message text
        timestamp
    });
    // Return the updated vector clock and discussion
    return {
        vectorClock,
        discussion: discussionQueue.toArray()
    };
};

module.exports = { handleNewMessage };
