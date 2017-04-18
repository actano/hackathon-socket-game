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
})

app.use(express.static(path.resolve(__dirname + '/../../dist')))

const UP = 'UP'
const DOWN = 'DOWN'
const LEFT = 'LEFT'
const RIGHT = 'RIGHT'
const worldSize = [200, 100]
const frameRate = 1000

let timer

let state = {
  world: null,
  players: [],
  lastPlayerId: 0,
  running: false,
  frameIdx: 0,
}



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
    player.position = position
    player.heading = heading

    console.log(player.id, position, heading)
  }

  timer = setInterval(gameLoop, frameRate)
}

function gameLoop() {
  // update positions
  // check for collisions
  // remove lost players
  const youAreDead = false
  console.log('frame', state.frameIdx)
  state.players
    .filter(p => p.state)
    .forEach((player) => {
      console.log('in gameloop', player)
      player.socket.emit('next frame', {
        frameIdx: state.frameIdx,
        world: state.world,
        youAreDead,
        players: state.players.map(p => ({ id: p.id, position: p.position, heading: p.heading })),
      })
    })
  state.frameIdx++
}

io.on('connection', function(socket){
  if (state.running) {
    return
  }

  const playerId = state.lastPlayerId
  state.players.push({
    socket,
    id: playerId,
    position: null,
    heading: null,
    playing: true,
  })
  console.log('connected:', playerId)

  io.emit('join', `${playerId}`)
  state.lastPlayerId = playerId + 1

  socket.on('disconnect', () => {
    state.players.forEach((player) => {
      if (player.socket === socket) {
        console.log('disconnected client', player.id)
        player.socket = null
        player.playing = false
      }
    })
  })

  socket.on('player movement', (event) => {
    const { playerId, direction } = event
    // handle direction
  })

  socket.on('start game', () => {
    if (!state.running) startGameLoop()
  })
})

http.listen(port, function(){
  console.log('listening on *:' + port);
})
