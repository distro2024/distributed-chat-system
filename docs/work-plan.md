# Work Plan

## Introduction

The purpose of this project is to research distributed chat systems and to implement a working prototype. As a novel approach, this system does not contain persistent storage. Instead, chat discussions are transient, like phone calls, and remain active only until all nodes leave the communication. At that point, the discussion is gone and cannot be retrieved.

The justification for such an implementation is that in today's world, we all live with an ever-growing digital footprint. At the same time, many of us have a need for private communication. Most social media services maintain communication history, making it difficult to clear previous discussions. This project introduces an approach in which each discussion is transient by default, promoting a new type of real-time, text-based communication.

## Techical overview

The system under design provides a chat application for end users. When users launch the application to initiate a chat discussion, the client application becomes one of the nodes in the distributed chat system. The system includes a "node director" responsible for connecting nodes to each other. In this proof-of-concept version all nodes participate in the same discussion.

### Joining group discussion

When a new new node wants to join the discussion, node director gives provides the new node the contact information for all nodes participating in the discussion. Either the node director or the joining node then inform the nodes already in the discussion about the new node. The team will consider the resilience and recovery of the node director as well to ensure that the system under design has desired level of fault tolerance in cases where the node director is compromised. 


![three nodes and a node director](./img/work-plan-01.jpg)

### Sending and receiving messages

The nodes will send chat messages to all other nodes in the group discussion. The team will investigate a mechanism for transferring chat messages to each other efficiently. The idea is to implement or mimic multicast functionality that works also when the nodes are in different networks. As a starting point, the team investigates using websockets for inter-node communication. As communication between nodes is direct node-to-node discussion, no middleware is required in this proof-of-concept phase. 

### Node director
The Node Director has one primary function: when a client connects to the director, the director redirects the client to the current leader's server. The leader notifies the director of its presence every few seconds. Therefore, the director includes two endpoints:

`POST /register_leader` the director receives the leader's ID and public address.</br>
`GET /` redirects the client to the current leader's server.

### Consistency in discussion 

Additionally, there will be a system to ensure that messages are ordered in a predefined manner. As a starting point the team will investigate implementing vector clocks. 

### Joining and leaving the group discussion

Mechanisms will also be in place to handle situations where nodes join or leave the discussion and to resolve any discrepancies in discussion histories among nodes. The team will investigate different coordination and leader election strategies and consider implementing a coordinator role to provide needed services to the connected nodes. One role of the elected coordinator is to provide new joining nodes a replica of the current state of the group discussion. 

### Language

The chat nodes and the node director will be implemented using Node.js. Node.js has a strong reputation in handling asynchronous calls, which the team considers to be a critical functionality for the system under design. 

### No persistent storage

As the motivation is to built a system for group discussions without any persistent memory, no database is necessary for this proof-of-concept. Once all client applications shut down, the discussion is lost forever.

### Container technology

All nodes will reside within containers, which may or may not be located on the same physical machine. This containerized approach ensures flexibility, scalability, and ease of deployment across different environments.


## Schedule

During the first two weeks of the project, the team has concentrated on research and planning. They have designed a preliminary architecture for the implementation and selected the technologies to be used. With these foundational steps completed, the project is now poised to enter the development phase. 

However, some critical details still need to be finalized. Specifically, the technical aspects of inter-node communication and synchronization are yet to be determined. These topics will be addressed in the lectures during weeks 3 and 4, after which the necessary design decisions will be made.

In the meantime, the team can proceed by developing the chat nodes and the node director. This phased approach allows for continuous progress while awaiting further clarification on the remaining technical issues.

## Group practices

The team maintains active communication through a group discussion on Telegram. Each weekend, they hold an online call to plan the upcoming week and discuss any current issues. Work items are coordinated using a Kanban-style project board on GitHub, where tasks are tracked as issues. This approach helps the team better estimate workloads, coordinate active tasks, and plan the project's timeline effectively.
