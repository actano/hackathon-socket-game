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

const UP = 'UP'
const DOWN = 'DOWN'
const LEFT = 'LEFT'
const RIGHT = 'RIGHT'
const worldSize = [200, 100]

let state = {
  world: null,
  players: [],
  lastPlayerId: 0,
  running: false,
}

app.get('/start', (req, res) => {
  // res.sendFile(__dirname + '/game.html');
  startGameLoop()
  res.send('started')
})


function getInitialPosition(idx, numberOfPlayers) {
  const [ maxX, maxY ] = worldSize
  const availableStartPositions = (maxX - 1)*2 + (maxY - 1)*2
  let position = Math.floor(idx/numberOfPlayers*availableStartPositions + maxX/2)

  if (position < maxX) {
    return { heading: DOWN, position: [position, 0] }
  }
  position -= maxX
  if (position < maxY) {
    return { heading: LEFT, position: [maxX-1, position] }
  }

  position -= maxY
  if (position < maxX) {
    return { heading: UP, position: [maxX - position, maxY-1] }
  }

  position -= maxX
  if (position < maxX) {
    return { heading: RIGHT, position: [0, maxY - position] }
  }

  position -= maxY
  return { heading: DOWN, position: [position, 0] }
}

function initializeWorld(size) {
  const world = new Array(size[0])
  return world.map(() => new Array(size[1]).fill(null))
}

function startGameLoop() {
  state.world = initializeWorld(worldSize)
  state.running = true
  for (const playerIdx in state.players) {
    const player = state.players[playerIdx]
    const { heading, position } = getInitialPosition(playerIdx, state.players.length)
    player.positions.push(position)
    player.heading = heading

    console.log(player.id, position, heading)
  }

  // TODO: set to true
  while (false) {
    // update positions
    // check for collisions
    // remove lost players
    // notifiy players
    // sleep
  }
}

io.on('connection', function(socket){
  if (state.running) {
    return
  }

  const playerId = state.lastPlayerId
  state.players.push({
    socket,
    id: playerId,
    positions: [],
    heading: null,
    playing: true,
  })
  console.log('connected:', playerId)

  io.emit('join', `${playerId}`)
  state.lastPlayerId = playerId + 1

  socket.on('disconnect', () => {
    state.players.forEach((player) => {
      if (player.socket === socket) {
        player.socket = null
        player.playing = false
      }
    })
  })

  socket.on('player movement', (event) => {
    const { id, direction } = event
    // handle direction
  })
})

http.listen(port, function(){
  console.log('listening on *:' + port);
})
