// Create Express app
const express = require('express')
const app = express();

app.use(express.static(`${__dirname}/public`));

let port = process.env.PORT || 8000;
const server = app.listen(port, () => console.log(`Server started on port ${port}`));

// Initialize Socket.io
const io = require('socket.io')(server);

// On client connect
io.on('connection', (socket) => {
  let id = socket.id;
  console.log(`(ID:${id}) User Connected...`)

  // Handle user disconnect
  socket.on('disconnect', () => console.log(`(ID:${id}) User disconnected...`));

  // Handle chat message sending
  socket.on('new message', msg => {
    // Tell all clients to add message.
    io.emit('new message', msg);
  });
});