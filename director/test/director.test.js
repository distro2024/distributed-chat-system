const { test, describe } = require('node:test');
const assert = require('node:assert');
const supertest = require('supertest');

const app = require('../director');

const api = supertest(app);

describe('Director API', () => {
    test('returns the node itself as coordinator when no existing coordinator', async () => {
        const dummyNode = { nodeId: 'b4177f08-879d-4612-a054-55345e2b31d3', nodeAddress: 'localhost:666' };
        const response = await api.post('/join_chat').send(dummyNode).expect(200);

        assert.strictEqual(response.body.coordinator.nodeId, dummyNode.nodeId);
        assert.strictEqual(response.body.coordinator.nodeAddress, dummyNode.nodeAddress);
    });

    test('returns the real coordinator when one exist', async () => {
        const dummyCoordinator = { nodeId: 'b4177f08-879d-4612-a054-55345e2b31d3', nodeAddress: 'localhost:666' };
        const dummyNode = { nodeId: 'b4177f08-879d-4612-a054-55345e2b3666', nodeAddress: 'localhost:6661' };

        await api.post('/join_chat').send(dummyCoordinator).expect(200);

        const response = await api.post('/join_chat').send(dummyNode).expect(200);

        assert.strictEqual(response.body.coordinator.nodeId, dummyCoordinator.nodeId);
        assert.strictEqual(response.body.coordinator.nodeAddress, dummyCoordinator.nodeAddress);
    });

    test('updates the coordinator when requested', async () => {
        const dummyCoordinator = { nodeId: 'b4177f08-879d-4612-a054-55345e2b31d3', nodeAddress: 'localhost:666' };
        const dummyNode = { nodeId: 'b4177f08-879d-4612-a054-55345e2b3666', nodeAddress: 'localhost:6661' };

        await api.post('/join_chat').send(dummyCoordinator).expect(200);

        await api.post('/update_coordinator').send(dummyNode).expect(200);

        const newNode = { nodeId: '66677f08-879d-4612-a054-55345e2b3666', nodeAddress: 'localhost:6662' };
        const response = await api.post('/join_chat').send(newNode).expect(200);

        assert.strictEqual(response.body.coordinator.nodeId, dummyNode.nodeId);
        assert.strictEqual(response.body.coordinator.nodeAddress, dummyNode.nodeAddress);
    });

    test('handles coordinator heartbeat correctly', async () => {
        const dummyCoordinator = { nodeId: 'b4177f08-879d-4612-a054-55345e2b31d3', nodeAddress: 'localhost:666' };
        const dummyNode = { nodeId: 'b4177f08-879d-4612-a054-55345e2b3666', nodeAddress: 'localhost:6661' };

        await api.post('/join_chat').send(dummyCoordinator).expect(200);

        // simulate current coordinator dropping out
        await new Promise((resolve) => setTimeout(resolve, 3000));

        await api.post('/update_coordinator').send(dummyCoordinator).expect(200);

        const response = await api.post('/join_chat').send(dummyNode).expect(200);

        assert.strictEqual(response.body.coordinator.nodeId, dummyCoordinator.nodeId);
        assert.strictEqual(response.body.coordinator.nodeAddress, dummyCoordinator.nodeAddress);
    });
});
