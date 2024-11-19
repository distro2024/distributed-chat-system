let discussion = []
const handleNewMessage = async (vectorClock, msg) => {
    const { id, node_id, vector_clock, message, timestamp } = msg;
    // Ensure all keys in the received vector clock are present in the local vector clock
    
    for (const key in vector_clock) {
      if (!(key in vectorClock)) {
        vectorClock[key] = 0; // Initialize missing keys to 0
      }
    }
    // Merge the received vector clock into the local vector clock.
    // When sending a message, the sender merges its own vector clock into the local vector clock.
    for (const key in vector_clock) {
      vectorClock[key] = Math.max(vectorClock[key], vector_clock[key]);
    }
    // Add the message to the discussion
    discussion.push( { id, node_id, vectorClock: { ...vectorClock }, message, timestamp, });
    // Return the updated vector clock and discussion
    return {
        vectorClock, 
        discussion: sortMessages(discussion),
    };
  }

// This function sorts the messages based on their vector clocks and timestamps
const sortMessages = (messages) => {
    return messages.sort((a, b) => {
      // Sort messages by vector clock
      const vcA = a.vectorClock;
      const vcB = b.vectorClock;
      const allKeys = new Set([...Object.keys(vcA), ...Object.keys(vcB)]);
      for (const key of allKeys) {
        // The loop will break immediately when a difference is found
        if (vcA[key]< vcB[key]) {
          return -1;
        } else if (vcA[key]> vcB[key]) {
          return 1;
        }
      }
      // If vector clocks are concurrent (i.e., equal), timestamps serve as tiebreakers 
      return a.timestamp - b.timestamp;
    });
  };

  module.exports = { handleNewMessage, sortMessages };
