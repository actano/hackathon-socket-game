import $ from 'jquery'
import io from 'socket.io-client'

import { randomColor } from '../shared/shared'

import { renderPlayerList } from './player-list'

const scaleFactor = 4

const socket = io(window.location.href)
var myId = null;
let myColor = null
const state = {
  players: [],
  playerById: {},
}

const keyCodes = {
  ArrowLeft: 'LEFT',
  ArrowUp: 'UP',
  ArrowRight: 'RIGHT',
  ArrowDown: 'DOWN'
}

var canvas = document.getElementById('board');
var playerIcon = document.getElementById('player');

const nameInput = document.getElementById('name')

const updatePlayerList = players => {
  players.forEach(player => state.playerById[player.id] = player)
  const myself = state.playerById[myId]
  myColor = myself.color
  if (!nameInput.value) {
    nameInput.value = myself.name
  }
  state.players = players
  renderPlayerList(myId, players)
}

$(document).keydown((event) => {
  const key = keyCodes[event.key]
  if (key) {
    socket.emit('player movement', { playerId: myId, direction: key })
  }
})

$('#start-game').click(function() {
  socket.emit('start game', {})
})

$('#change-color').click(function() {
  myColor = randomColor()
  console.log(`color changed ${myColor}`)
  socket.emit('change color', { playerId: myId, color: myColor })
})

$('#name').keyup(function(event) {
  const newName = event.target.value
  const oldName = state.playerById[myId].name
  if (newName !== oldName) {
    socket.emit('change name', {playerId: myId, name: newName})
  }
})

socket.on('game over', (event) => {
  const { winner } = event
  if (winner === myId) {
    alert(`You won! Congratulations!`)
    return
  }
  if (winner === 0) {
    alert(`Everyone lost! Too bad.`)
    return
  }
  alert(`Player ${winner} won! More luck next time.`)
})

socket.on('assign player id', ({ id }) => {
  myId = id
  console.log(`assign player id ${myId}`)
  const existingName = nameInput.value
  if (existingName) {
    socket.emit('change name', {playerId: myId, name: nameInput.value})
  }
  if (myColor) {
    socket.emit('change color', {playerId: myId, color: myColor})
  }
})

socket.on('player joined', function(event){
  const { players, world } = event
  updatePlayerList(players)
  drawFrame(world, players)
});

socket.on('player left', function(event){
  const { id, players, world } = event
  console.log(`player ${id} disconnected`)
  updatePlayerList(players)
  drawFrame(world, players)
});

socket.on('player changed', function(event){
  const { id, players, world } = event
  console.log(`player ${id} changed`)
  updatePlayerList(players)
  drawFrame(world, players)
});

const NO_PLAYER_COLOR = [127, 127, 127]
const getPlayerColor = (playerId) => {
  const player = state.playerById[playerId]
  return player ? player.color : NO_PLAYER_COLOR
}

const toCssRGB = rgbArray =>
  `rgb(${rgbArray})`

socket.on('next frame', function(frame) {
  const { frameIdx, world, youAreDead, players } = frame
  drawFrame(world, players)
})

const drawFrame = (world, players) => {
  updatePlayerList(players)
  const myself = state.playerById[myId]
  playerIcon.style.backgroundColor = toCssRGB(getPlayerColor(myId))

  let width = world.length;
  let height = world[0].length;
  canvas.style.width = `${width * scaleFactor}px`
  canvas.style.height = `${height * scaleFactor}px`
  canvas.setAttribute('width', width)
  canvas.setAttribute('height', height)


  var buffer = new Uint8ClampedArray(width * height * 4).fill(255);

  let pos = 0
  for(var y = 0; y < height; y++) {
    for(var x = 0; x < width; x++, pos += 4) {
        const playerId = world[x][y]
        // playerId = 1
        if (playerId != null) {
          const playerColor = getPlayerColor(playerId)
          buffer[pos  ] = playerColor[0] // some R value [0, 255]
          buffer[pos+1] = playerColor[1] // some G value
          buffer[pos+2] = playerColor[2] // some B value
          buffer[pos+3] = 128            // set alpha channel
        }
    }
  }

  for(var playerHeads = 0; playerHeads < players.length; playerHeads++) {
    let [x, y] = players[playerHeads].position;
    pos = (y * width + x) * 4; // position in buffer based on x and y
    buffer[pos+3] = 255;           // set alpha channel
  }

  var ctx = canvas.getContext('2d');

  // create imageData object
  var idata = ctx.createImageData(width, height);

  // set our buffer as source
  idata.data.set(buffer);

  // update canvas with new data
  ctx.imageSmoothingEnabled = false;
  ctx.putImageData(idata, 0, 0);
}

