const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Store separate message histories for each room/major
const roomHistories = {
  General: [],
  Engineering: [],
  Business: [],
  Arts: [],
  Science: []
};

io.on('connection', (socket) => {
  console.log('A user connected');

  // Join a specific room/major
  socket.on('join room', (roomName) => {
    // Leave previous rooms
    Array.from(socket.rooms).forEach(r => {
      if (r !== socket.id) socket.leave(r);
    });

    socket.join(roomName);
    socket.currentRoom = roomName;

    // Send history for this specific room
    const history = roomHistories[roomName] || [];
    socket.emit('load history', history);
  });

  // Handle incoming message for the active room
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

    // Broadcast only to people in this room
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
