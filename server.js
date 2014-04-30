// Dependencies are defined

var express = require("express")
  , app = express()
  , http = require("http").createServer(app)
  , io = require("socket.io").listen(http)
  , _ = require("underscore");

// Global var used in the app

var participants = []

/* Server config */

// 1. IP address
// 2. Port Number
// 3. Specify views folder
// 4. Specify view engine
// 5. Set static content dir
// 6. Support JSON, urlencoded, and multipart requests

app.set("ipaddr", "127.0.0.1");
app.set("port", 8080);
app.set("views", __dirname + "/views");
app.set("view engine", "jade");
app.use(express.static("public", __dirname + "/public"));
app.use(express.bodyParser());

/* Server routing */

app.get("/", function(request, response) {
  response.render("index");
});

app.post("/message", function(request, response) {
  var message = request.body.message;

  if(_.isUndefined(message) || _.isEmpty(message.trim())) {
    return response.json(400, {error: "Message is invalid"});
  }

  var name = request.body.name;

  // Emit to Socket's event listener that there was a message
  io.sockets.emit("incomingMessage", {message: message, name: name});

  response.json(200, {message: "Message received"});
});

/* Socket.IO events */
io.on("connection", function(socket){
  
  // Listens to newUser event, pushes user to participants array, emits to Socket about a newConnection
  socket.on("newUser", function(data) {
    participants.push({id: data.id, name: data.name});
    io.sockets.emit("newConnection", {participants: participants});
  });

  // Name change
  socket.on("nameChange", function(data) {
    _.findWhere(participants, {id: socket.id}).name = data.name;
    io.sockets.emit("nameChanged", {id: data.id, name: data.name});
  });

  // Disconnect
  socket.on("disconnect", function() {
    participants = _.without(participants,_.findWhere(participants, {id: socket.id}));
    io.sockets.emit("userDisconnected", {id: socket.id, sender:"system"});
  });

});

http.listen(app.get("port"), app.get("ipaddr"), function() {
  console.log("=> Node.js application starting in development on http://" + app.get("ipaddr") + ":" + app.get("port"))
  console.log("=> Ctrl-C to shutdown server")
});