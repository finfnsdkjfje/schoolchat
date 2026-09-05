const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Store room history for DSA topics
const roomHistories = {
  General: [],
  DataStructures: [],
  Algorithms: [],
  WebDev: [],
  MachineLearning: [],
  Cybersecurity: []
};

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join room', (roomName) => {
    Array.from(socket.rooms).forEach(r => {
      if (r !== socket.id) socket.leave(r);
    });

    socket.join(roomName);
    socket.currentRoom = roomName;

    const history = roomHistories[roomName] || [];
    socket.emit('load history', history);
  });

  socket.on('chat message', (data) => {
    const room = socket.currentRoom || 'General';
    const messageObject = {
      user: data.user || 'Anonymous',
      text: data.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (!roomHistories[room]) roomHistories[room] = [];
    roomHistories[room].push(messageObject);
    if (roomHistories[room].length > 50) roomHistories[room].shift();

    io.to(room).emit('chat message', messageObject);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chat room running on port ${PORT}`);
});
