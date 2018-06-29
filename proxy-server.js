module.exports = function(app) {
  const express = require("express");
  var http = require("http").Server(app);
  var io = require("socket.io").listen(http);

  app.use(express.static("build"));
  app.get("/", function(req, res) {
    res.sendFile(__dirname + "/index.html");
  });

  console.log(io);

  io.on("connection", function(socket) {
    console.log("a user connected");
    socket.on("disconnect", function() {
      console.log("user disconnected");
    });
  });
};
