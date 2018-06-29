var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var players = {};
const colors = ["red", "blue", "green", "purple"];
let colorIndex = 0;
let tagId = null;
let canTag = true;

app.use(express.static("build"));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket) {
  console.log("a user connected: ", socket.id);
  if (!tagId) {
    tagId = socket.id;
  }
  socket.emit("newTag", tagId);
  socket.broadcast.emit("newTag", tagId);
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 0) + 80,
    y: Math.floor(Math.random() * 0) + 100,
    playerId: socket.id,
    color: colors[++colorIndex % colors.length],
    isTag: tagId == socket.id
  };

  socket.emit("currentPlayers", players);
  socket.broadcast.emit("newPlayer", players[socket.id]);
  socket.on("disconnect", function() {
    console.log("user disconnected: ", socket.id);
    if (tagId == socket.id) {
      tagId = null;
    }
    delete players[socket.id];
    io.emit("disconnect", socket.id);
  });

  socket.on("tag", function(data) {
    if (canTag) {
      canTag = false;
      setTimeout(function() {
        canTag = true;
      }, 1000);
      if (!data) {
        console.log("Invalid tag data sent on collision");
      }

      if (tagId != data) {
        tagId = data;
        socket.emit("newTag", tagId);
        socket.broadcast.emit("newTag", tagId);
      }
    }
  });

  socket.on("playerMovement", function(movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].dir = movementData.dir;
    socket.broadcast.emit("playerMoved", players[socket.id]);
  });
});

http.listen(3000, function() {
  console.log("listening on *:3000");
});
