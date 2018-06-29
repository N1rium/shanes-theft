const express = require("express");
const path = require("path");
const proxy = require("http-proxy-middleware");
const proxyServer = require("./proxy-server");
const app = express();

const PORT = 4444;

proxyServer(app);

app.listen(PORT, function() {
  console.log(`Static server listening on port ${PORT}.`);
});
