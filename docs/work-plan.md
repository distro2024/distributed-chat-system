# Work Plan

## Introduction

The purpose of this project is to research distributed chat systems and to implement a working prototype. As a novel approach, this system does not contain persistent storage. Instead, chat discussions are transient, like phone calls, and remain active only until all nodes leave the communication. At that point, the discussion is gone and cannot be retrieved.

The justification for such an implementation is that in today's world, we all live with an ever-growing digital footprint. At the same time, many of us have a need for private communication. Most social media services maintain communication history, making it difficult to clear previous discussions. This project introduces an approach in which each discussion is transient by default, promoting a new type of real-time, text-based communication.

## Techical overview

The system under design provides a chat application for end users. When users launch the application to initiate a chat discussion, the client application becomes one of the nodes in the distributed chat system. We are still considering various approaches for node participation. Nodes could either join a shared discussion, connect to random discussions, or allow end users to choose whether to start a new discussion or join an existing group discussion. The system includes a "node director" responsible for connecting nodes to each other.

![three nodes and a node director](./img/work-plan-01.jpg)

The nodes will employ a message brokering mechanism that enables them to pass chat messages to each other efficiently. Additionally, there will be a system to ensure that messages are ordered in a predefined manner. Mechanisms will also be in place to handle situations where nodes join or leave the discussion and to resolve any discrepancies in discussion histories among nodes.

The chat nodes will be implemented using Node.js, while the "node director" will be developed in Python. This dual-technology approach aims to study systems where different components are built with different technologies and to explore the asynchronous communication features of both Node.js and Python.

All nodes will reside within containers, which may or may not be located on the same physical machine. This containerized approach ensures flexibility, scalability, and ease of deployment across different environments.


## Schedule

During the first two weeks of the project, the team has concentrated on research and planning. They have designed a preliminary architecture for the implementation and selected the technologies to be used. With these foundational steps completed, the project is now poised to enter the development phase. 

However, some critical details still need to be finalized. Specifically, the technical aspects of inter-node communication and synchronization are yet to be determined. These topics will be addressed in the lectures during weeks 3 and 4, after which the necessary design decisions will be made.

In the meantime, the team can proceed by developing the chat nodes and the node director. This phased approach allows for continuous progress while awaiting further clarification on the remaining technical issues.

## Group practices

The team maintains active communication through a group discussion on Telegram. Each weekend, they hold an online call to plan the upcoming week and discuss any current issues. Work items are coordinated using a Kanban-style project board on GitHub, where tasks are tracked as issues. This approach helps the team better estimate workloads, coordinate active tasks, and plan the project's timeline effectively.