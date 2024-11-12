/*
 * Chat nodes participate in the distributed chat system group discussion.
 * They store messages and can send and receive messages. One chat node
 * serves as the group coordinator and provides services to other chat nodes.
 *
 */
class ChatNode {
  #id
  #messages
  #coordinator
  #nodes
  #electionVotes

  constructor(id, nodes) {
    // List of chat nodes in the group
    this.id = id
    this.#nodes = []
    // Current state of the chat discussion
    this.#messages = []
    this.#coordinator = false
    this.#electionVotes = []
  }

  /*
   * Add a message to the chat node
   * @param {string} message - The message to add
   */
  addMessage(message) {
    this.messages.push(message)
  }

  /**
   * Get the messages stored in the chat node
   * @returns {Array} - The messages stored in the chat node
   */
  getMessages() {
    return this.messages
  }

  /**
   * Add a new node to the chat group
   * @param {any} node a new node to add to the chat group
   */
  addNode(node) {
    this.nodes.push(node)
  }

  /**
   * Remove a node from the chat group
   * @param {*} node a node to remove from the chat group
   */
  removeNode(node) {
    const index = this.nodes.indexOf(node)
    if (index > -1) {
      this.nodes.splice(index, 1)
    }
  }

  /**
   * Validate whether this node won the election
   */
  isCoordinator() {
    // code will be implemented in the future
  }

  /**
   * Get the winner of the election
   */
  getCoordinator() {
    // code will be implemented in the future
  }
}
