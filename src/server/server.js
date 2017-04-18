import express from 'express'
import { Server } from 'http'
import socketIo from 'socket.io'
import path from 'path'

const app = express()
const http = Server(app);
const io = socketIo(http);
const port = process.env.PORT || 3000;

app.get('/', function(req, res){
  res.sendFile(path.resolve(__dirname + '/../client/index.html'))
});

app.use(express.static(path.resolve(__dirname + '/../../dist')))

const clients = []
let lastClientIdx = 0

io.on('connection', function(socket){
  clients.push(lastClientIdx)

  io.emit('join', `client ${lastClientIdx}`)
  lastClientIdx++

  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
