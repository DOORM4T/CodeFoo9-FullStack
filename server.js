// Create Express Server
const express = require('express')
const app = express();

app.use(express.static(`${__dirname}/public`));

let port = process.env.PORT || 8000;
const server = app.listen(port, () => console.log(`Server started on port ${port}`));


// Connect to MongoDB Atlas
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://door:matt@codefoo9-chatapp-jahed.azure.mongodb.net/test?retryWrites=true";
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
  // Initialize Socket.io
  const io = require('socket.io')(server);

  // List of users in chat
  let users = new Set();

  // On client connect
  io.on('connection', (socket) => {
    socket.emit('get user list', [...users]);

    // Connect DB
    let collection = client.db("global-chat").collection("messages");
    let username;

    // Add alert to DB
    const addAlert = msg => {
      collection.insertOne({ message: msg }, () => {
        console.log(`Added ${msg} to Database.`)
      });
    }
    // Add message (username included) to DB
    const addMessage = data => {
      collection.insertOne({ user: data.user, message: data.msg, time: data.timestamp }, () => {
        console.log(`Added ${data.timestamp} ${data.user}:${data.msg} to Database.`)
      });
    }

    // Socket functions
    let id = socket.id;
    console.log(`(ID:${id}) User connected...`)

    // Broadcasting new user entering chat
    socket.on('new user', async user => {
      // Render messages from DB on client chat
      let data = await collection.find({}).toArray();
      socket.emit('initial render', data);

      // Announce new user to other users
      username = user;
      // Update list of users for clients
      users.add(username);
      io.emit('get user list', [...users]);

      io.emit('announce user', username);
      addAlert(`${user} has joined the chat!`);
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
      if (username !== undefined) {
        console.log(`(ID:${id}) User disconnected...`)

        users.delete(username);
        io.emit('get user list', [...users]);

        io.emit('user disconnected', username);
        addAlert(`${username} has left the chat.`);
      }
    });

    // Handle chat message sending
    socket.on('new message', data => {
      // Tell all clients to add message.
      io.emit('get message', data);
      addMessage(data);
    });

    let typers = new Set();
    socket.on('user is typing', user => {
      typers.add(user);
      io.emit('user is typing', [...typers]);
    })

    socket.on('user stopped typing', user => {
      typers.delete(user);
      io.emit('user is typing', [...typers])
    })
  });
});