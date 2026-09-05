const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve the HTML file when someone visits the website
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Store messages in memory so new users can see chat history
const chatHistory = [];

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('A user joined the chat');

  // Send past messages to the person who just joined
  socket.emit('load history', chatHistory);

  // Listen for a incoming chat message
  socket.on('chat message', (data) => {
    const messageObject = {
      user: data.user || 'Anonymous',
      text: data.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Save message to history (keep last 50)
    chatHistory.push(messageObject);
    if (chatHistory.length > 50) chatHistory.shift();

    // Broadcast the message to EVERYONE connected
    io.emit('chat message', messageObject);
  });

  socket.on('disconnect', () => {
    console.log('A user left the chat');
  });
});

// Run server on port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chat room is running on port ${PORT}`);
});
