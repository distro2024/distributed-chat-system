const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const redisAdapter = require('socket.io-redis');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const redisHost = 'redis';
io.adapter(redisAdapter({ host: redisHost, port: 6379 }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('message', (data) => {
        console.log('Message received:', data);
        io.emit('message', data); 
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});