import 'babel-polyfill'
import express from 'express'
import { Server } from 'http'
import socketIo from 'socket.io'
import path from 'path'

import { getRandomInt, randomColor } from '../shared/shared'

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
const frameRate = 20

let timer

let state = {
  world: null,
  players: [],
  lastPlayerId: 1,
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
  let world = new Array(size[0]).fill(null)
  world.forEach((_, x) => {
    world[x] = new Array(size[1]).fill(null)
  })
  return world
}

function startGameLoop() {
  state.running = true
  timer = setInterval(gameLoop, frameRate)
}

function getWinner() {
  const winner = activePlayers()
  return winner.length ? winner[0].id : 0
}

function stopGameLoop() {
  clearInterval(timer)
  // send to all clients
  const winner = getWinner()
  state.players.filter(p => p.socket)
    .forEach(p => {
      p.socket.emit('game over', { winner })
    })
}

const directionIncrement = {
  [UP]: [0, -1],
  [DOWN]: [0, 1],
  [LEFT]: [-1, 0],
  [RIGHT]: [1, 0],
}

function isInRange(a, max) {
  return 0 <= a && a < max
}

function activePlayers() {
  return state.players.filter(p => p.playing)
}

function connectedPlayers() {
  return state.players.filter(p => p.socket)
}

function calculateNextFrame() {
  activePlayers()
    .forEach((player) => {
      const inc = directionIncrement[player.heading]

      player.position[0] += inc[0]
      player.position[1] += inc[1]

      const [x, y] = player.position
      const [maxX, maxY] = worldSize

      if (!isInRange(x, maxX) || !isInRange(y, maxY) || state.world[x][y]) {
        // collision!
        player.playing = false
        return
      }

      state.world[x][y] = player.id
    })

  const activePlayerCount = activePlayers().length
  if (activePlayerCount <= 1) {
    stopGameLoop()
  }
}

const playerStatus = ({ id, position, heading, playing, color, name }) => ({
  color,
  heading,
  id,
  name,
  playing,
  position,
})

function gameLoop() {
  calculateNextFrame()
  console.log('frame', state.frameIdx, 'active players', activePlayers().map(p => p.id))
  connectedPlayers()
    .forEach((player) => {
      player.socket.emit('next frame', {
        frameIdx: state.frameIdx,
        world: state.world,
        youAreDead: !player.playing,
        players: state.players.map(playerStatus),
      })
    })
  state.frameIdx++
}

const connectionEvent = (eventType, playerId) => {
  state.world = initializeWorld(worldSize)
  for (const playerIdx in state.players) {
    const player = state.players[playerIdx]
    const { heading, position } = getInitialPosition(playerIdx, state.players.length)
    player.position = position
    player.heading = heading

    const [x, y] = position
    console.log(x, y)
    state.world[x][y] = player.id

    console.log(player.id, position, heading)
  }

  io.emit(eventType, {
    playerId,
    players: connectedPlayers().map(playerStatus),
    world: state.world,
    running: state.running,
  })
}

const consonant = 'bcdfghjklmnpqrstvwxyz'
const vocal = 'aeiou'

const createName = () => {
  const sylbs = getRandomInt(2, 5)
  let name = ''
  for(let i = 0; i < sylbs; ++i) {
    if (getRandomInt(0, 5) === 0) {
      name += vocal[getRandomInt(0, vocal.length)]
    }
    name += consonant[getRandomInt(0, consonant.length)]
    name += vocal[getRandomInt(0, vocal.length)]
    if (getRandomInt(0, 5) === 0) {
      name += vocal[getRandomInt(0, vocal.length)]
    }
  }
  return name
}

io.on('connection', function(socket){
  const playerId = state.lastPlayerId
  state.players.push({
    socket,
    id: playerId,
    position: null,
    heading: null,
    name: createName(),
    playing: !state.running,
    color: randomColor(),
  })
  console.log('connected:', playerId)

  socket.emit('assign player id', { id: playerId })
  connectionEvent('player joined', playerId)
  state.lastPlayerId = playerId + 1

  socket.on('disconnect', () => {
    const playerIdx = state.players.findIndex(p => p.socket === socket)
    const player = state.players[playerIdx]
    console.log('disconnected client', player.id)
    player.socket = null
    player.playing = false
    if (!state.running) {
      state.players.splice(playerIdx, 1)
    }
    connectionEvent('player left', playerId)
  })

  socket.on('player movement', (event) => {
    const { playerId, direction } = event
    console.log('movement event', playerId, direction)
    const player = state.players.find(p => p.id === playerId)
    player.heading = direction
  })

  socket.on('start game', () => {
    io.emit('game started', {})
    if (!state.running) startGameLoop()
  })

  socket.on('change name', (event) => {
    const { playerId, name } = event
    const player = state.players.find(p => p.id === playerId)
    player.name = name
    connectionEvent('player changed', playerId)
  })

  socket.on('change color', (event) => {
    const { playerId, color } = event
    console.log(`color changed ${color} on player ${playerId}`)
    const player = state.players.find(p => p.id === playerId)
    player.color = color
    console.log('###', player)
    connectionEvent('player changed', playerId)
  })
})

http.listen(port, function(){
  console.log('listening on *:' + port);
})
