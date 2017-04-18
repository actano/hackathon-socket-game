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
const worldSize = [100, 100]

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
  // const [ maxX, maxY ] = state.worldSize
  const maxX = worldSize[0]
  const maxY = worldSize[1]
  const availableStartPositions = (maxX - 1)*2 + (maxY - 1)*2
  const positionsPerEdge = availableStartPositions / 4
  let position = idx/numberOfPlayers
  if (position < positionsPerEdge) {
    return [position * maxX/positionsPerEdge, 0]
  }
  position -= positionsPerEdge
  if (position < positionsPerEdge) {
    return [maxX, position * maxY/positionsPerEdge]
  }

  position -= positionsPerEdge
  if (position < positionsPerEdge) {
    return [positionsPerEdge - position * maxX/positionsPerEdge, maxY]
  }

  position -= positionsPerEdge
  return [0, positionsPerEdge - position * maxY/positionsPerEdge]
}

function getInitialHeading() { return UP }

function initializeWorld(size) {
  const world = new Array(size[0])
  return world.map(() => new Array(size[1]).fill(null))
}

function startGameLoop() {
  state.world = initializeWorld(worldSize)
  state.running = true
  for (const playerIdx in state.players) {
    const player = state.players[playerIdx]
    const position = getInitialPosition(playerIdx, state.players.length)
    player.positions.push(position)
    player.heading = getInitialHeading(position)

    console.log(player.id, position)
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
  console.log(state)
  state.players.push({
    socket,
    id: playerId,
    positions: [],
    heading: null,
    playing: true,
  })

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
