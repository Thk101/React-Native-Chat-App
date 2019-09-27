const express = require("express"); //its a function to start the server
const http = require("http");
const socketIo = require("socket.io");
const mongojs = require("mongojs"); //mongojs is a function

const db = mongojs(
  process.env.MONGODB_URL || "mongodb://localhost:27017/local"
);
const app = express();
const server = http.Server(app);
const webSocket = socketIo(server);
server.listen(4001, () => {
  console.log(`listening on the port: 4001`);
});
// Poer from environment variables or defaults

const clients = {};
const users = {};

//there will be only one chatroom
const chatId = 1;

webSocket.on("connection", socket => {
  clients[socket.id] = socket;
  socket.on("userJoined", userID => {
    userJoined(userID, socket);
  });
  socket.on("message", message => {
    onMessageReceived(message, socket);
  });
});

const userJoined = (userID, socket) => {
  try {
    if (!userID) {
      db.connection("users").insert({}, (err, user) => {
        socket.emit("userJoined", user._id);
        users[socket.id] = user.id;
        _sendExistingMessage(socket);
      });
    } else {
      user[socket.id] = userID;
      _sendExistingMessages(socket);
    }
  } catch (err) {
    console.log(err);
  }
};
function onMessageReceived(message, senderSocket) {
  var userId = users[senderSocket.id];
  // Safety check.
  if (!userId) return;

  _sendAndSaveMessage(message, senderSocket);
}
// Helper functions.
// Send the pre-existing messages to the user that just joined.
function _sendExistingMessages(socket) {
  var messages = db
    .collection("messages")
    .find({ chatId })
    .sort({ createdAt: 1 })
    .toArray((err, messages) => {
      // If there aren't any messages, then return.
      if (!messages.length) return;
      socket.emit("message", messages.reverse());
    });
}
// Save the message to the db and send all sockets but the sender.
function _sendAndSaveMessage(message, socket, fromServer) {
  var messageData = {
    text: message.text,
    user: message.user,
    createdAt: new Date(message.createdAt),
    chatId: chatId
  };

  db.collection("messages").insert(messageData, (err, message) => {
    // If the message is from the server, then send to everyone.
    var emitter = fromServer ? websocket : socket.broadcast;
    emitter.emit("message", [message]);
  });
}
// Allow the server to participate in the chatroom through stdin.
var stdin = process.openStdin();
stdin.addListener("data", function(d) {
  _sendAndSaveMessage(
    {
      text: d.toString().trim(),
      createdAt: new Date(),
      user: { _id: "robot" }
    },
    null /* no socket */,
    true /* send from server */
  );
});

// const port = process.env.PORT || 4001;

// const app = express();
// const server = http.createServer(app);

// const io = socketIo(server);

// //setting a socket with the nameSpace "connection" for new sockets

// io.on("connection", socket => {
//   console.log("New client connected");

//   socket.io("incoming data", data => {
//     socket.broadcast.emit("outgoing data", { num: data });
//   });

//   socket.on("disconnect", () => {
//     "Client disconnected";
//   });
// });

// server.listen(port, () => console.log(`Listening on port ${port}`));
