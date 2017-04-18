import $ from 'jquery'
import io from 'socket.io-client'

import { renderPlayerList } from './player-list'

const socket = io(window.location.href)
var myId = null;

const keyCodes = {
  ArrowLeft: 'LEFT',
  ArrowUp: 'UP',
  ArrowRight: 'RIGHT',
  ArrowDown: 'DOWN'
}

var canvas = document.getElementById('board');
var playerIcon = document.getElementById('player');

let playerColors = new Array(100).fill(null)
for (let x = 0; x < 100; x++) {
  playerColors[x] = new Array(3).fill(0)
  playerColors[x][0] = getRandomInt(0, 255)
  playerColors[x][1] = getRandomInt(0, 255)
  playerColors[x][2] = getRandomInt(0, 255)
}

const updatePlayerList = players =>
  renderPlayerList(myId, players)

$(document).keydown((event) => {
  const key = keyCodes[event.key]
  if (key) {
    socket.emit('player movement', { playerId: myId, direction: key })
  }
})

$('#start-game').click(function() {
  socket.emit('start game', {})
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

socket.on('player joined', function(event){
  const { playerId, players, running } = event
  if (!myId) {
    myId = playerId
    console.log(myId)
  }
  updatePlayerList(players)
});

socket.on('player left', function(event){
  const { id, players } = event
  console.log(`player ${id} disconnected`)
  updatePlayerList(players)
});

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

socket.on('next frame', function(frame) {
  const { frameIdx, world, youAreDead, players } = frame
  const myself = players.find(p => (p.id === myId))

  let playerIdx = -1;
  for (let player = 0; player < players.length; player++) {
    if (players[player].id == myId) {
      playerIdx = player;
    }
  }
  playerIcon.style.backgroundColor = "rgb("+playerColors[playerIdx][0]+", "+playerColors[playerIdx][1]+", "+playerColors[playerIdx][2]+")"
  console.log(frameIdx, myself.position, 'dead?', youAreDead)

  // console.log("World", world)
  let width = world.length;
  let height = world[0].length;
  let playersCount = players.length

  var buffer = new Uint8ClampedArray(width * height * 4).fill(255);

  for(var y = 0; y < height; y++) {
    for(var x = 0; x < width; x++) {
        var pos = (y * width + x) * 4; // position in buffer based on x and y
        let playerId = world[x][y];
        // playerId = 1
        if (playerId != null) {
          let playerIdx = -1;
          for (let player = 0; player < players.length; player++) {
            if (players[player].id == playerId) {
              playerIdx = player;
            }
          }
          // console.log("playerIdx", playerIdx, "  ", playerId, "  ", players);
          // playerIdx = 1
          buffer[pos  ] = playerColors[playerIdx][0];           // some R value [0, 255]
          buffer[pos+1] = playerColors[playerIdx][1];           // some G value
          buffer[pos+2] = playerColors[playerIdx][2];           // some B value
          buffer[pos+3] = 128;           // set alpha channel
        }
    }
    updatePlayerList(players)
  }

  for(var playerHeads = 0; playerHeads < players.length; playerHeads++) {
    let [x, y] = players[playerHeads].position;
    var pos = (y * width + x) * 4; // position in buffer based on x and y
    buffer[pos+3] = 255;           // set alpha channel
  }

  var ctx = canvas.getContext('2d');

  // canvas.width = width;
  // canvas.height = height;

  // create imageData object
  var idata = ctx.createImageData(width, height);

  // set our buffer as source
  idata.data.set(buffer);

  // update canvas with new data
  ctx.imageSmoothingEnabled = false;
  ctx.putImageData(idata, 0, 0);
  // console.log(frameIdx, players)
})

