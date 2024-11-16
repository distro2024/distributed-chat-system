# Node-to-Node messaging

During design phase the team identified the following messages that are needed in node-to-node messaging. This document considers different approaches for implementing the messaging between nodes. 

## Possible messages

**Chat messages:** Any node (i.e. chat-node) can send chat-messages to other nodes: POST `/message`
```json
{ 
    "id": "uuid",
    "node-id": "uuid",
    "timestamp": "timestamp",
    "message": "string"
    "vector-clock:" ["int"]
}
```

**Initiating an election:** Messages related to the election process with Bully-algorithm. Any node can initiate election process by sending a request to nodes with higher priority: POST `/election`

```json
{
    "node-id": "uuid"
}
```

**Responding to an election message:** Higher priority nodes respond with an OK: POST `/vote`
```json
{
    "ok": "uuid"
}
```
<div class="page"/>

**Announcing coordinator -role:** Once one of the nodes has bullied other into submission, they notify other nodes that they are the new coordinator: POST `/update-coordinator`
```json
{
    "coodinator": "uuid"
}
```


**Coordinator - update nodes:** The coordinator node can send a message requesting other nodes to update the record of actives nodes in group discussion after nodes join or leave the discussion: POST `/nodes`
```json
{
    "node": ["uuid"]
}
```

**Coordinator - get disussion:** Any node can get the discussion history from coordinator node: GET `/discussion`

**Coordinator - update discussion:** The coordinator then responds with the discussion history (a list of message objects): POST `/discussion`

```json
{
    "messages": [
        { 
            "id": "uuid",
            "node-id": "uuid",
            "timestamp": "timestamp",
            "message": "string"
            "vector-clock:" ["int"]
        }
    ] 
}
```


## Idea 1 - JSON objects with shared key

The first proposal is to include a shared `key` to all JSON objects that identifies the **type** of the message. With this key the receiver of the message knows how the message should be processed. If a message does not contain the key indicating the message type, the message is disregarded.   

As an example, here are three different messages to illustrate the implementation: 

**Chat messages:** 
```json
{ 
    "type": "MESSAGE",
    "id": "uuid",
    "node-id": "uuid",
    "timestamp": "timestamp",
    "message": "string"
    "vector-clock:" ["int"]
}
```

**Initiating an election:**
```json
{
    "type": "ELECTION",
    "node-id": "uuid"
}
```


**Coordinator - update nodes:** 
```json
{
    "type": "NODES",
    "node": ["uuid"]
}
```

### Advantages
- This solution is easy to implement and as the nodes all share the same code, they can also share hard coded constant values for message types. 
- Each node can listen to a socket and then just handle incoming messages based on the content. No need to have different routes for incoming traffic. 
  - Note: the communication between the COORDINATOR and NODE DIRECTOR may still happen over HTTP/2. 


### Disadvantages
- Should look into scalability. What happens if the content is large (e.g. the discussion history is long)? 
- Should also look into security considerations. Should we somehow authenticate senders? Should we account for malicious intents? What else? 

