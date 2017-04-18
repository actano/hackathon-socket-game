import $ from 'jquery'
import io from 'socket.io-client'

const socket = io(window.location.href)
var myId = null;
$('form').submit(function(){
  socket.emit('chat message', { id: myId, msg: $('#m').val() });
  $('#m').val('');
  return false;
});

const keyCodes = {
  ArrowLeft: 'LEFT',
  ArrowUp: 'UP',
  ArrowRight: 'RIGHT',
  ArrowDown: 'DOWN'
}

var canvas = document.getElementById('board');

$(document).keypress((event) => {
  const key = keyCodes[event.keyCode]
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

socket.on('join', function(playerId){
  if (!myId) {
    myId = playerId
    console.log(myId)
  }
  $('#messages').append($('<li>').text(`client joined: ${playerId}`));
  window.scrollTo(0, document.body.scrollHeight);
});

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

socket.on('next frame', function(frame) {
  const { frameIdx, world, youAreDead, players } = frame
  const myself = players.find(p => (p.id === myId))
  console.log(frameIdx, myself.position, 'dead?', youAreDead)

  // console.log("World", world)
  let height = world.length;
  let width = world[0].length;
  let playersCount = players.length

  var buffer = new Uint8ClampedArray(width * height * 4).fill(255);

  let playerColors = new Array(playersCount).fill(null)
  playerColors.forEach((_, x) => {
    playerColors[x] = new Array(3).fill(0)
    playerColors[x][0] = getRandomInt(0, 255)
    playerColors[x][1] = getRandomInt(0, 255)
    playerColors[x][2] = getRandomInt(0, 255)
    console.log(playerColors[x]);
  })

  for(var y = 0; y < height; y++) {
    for(var x = 0; x < width; x++) {
        var pos = (y * width + x) * 4; // position in buffer based on x and y
        let playerId = world[y][x];
        // playerId = 1
        if (playerId != null) {
          let playerIdx = -1;
          for (let player = 0; player < players.length; player++) {
            if (players[player].id == playerId) {
              playerIdx = player;
            }
          }
          console.log("playerIdx", playerIdx, "  ", playerId, "  ", players);
          // playerIdx = 1
          buffer[pos  ] = playerColors[playerIdx][0];           // some R value [0, 255]
          buffer[pos+1] = playerColors[playerIdx][1];           // some G value
          buffer[pos+2] = playerColors[playerIdx][2];           // some B value
          buffer[pos+3] = 200;           // set alpha channel
        }
    }
}

  for(var playerHeads = 0; playerHeads < players.length; playerHeads++) {
    let [y, x] = players[playerHeads].position;
    var pos = (y * width + x) * 4; // position in buffer based on x and y
    buffer[pos+3] = 255;           // set alpha channel
  }

  var ctx = canvas.getContext('2d');

  canvas.width = width;
  canvas.height = height;

  // create imageData object
  var idata = ctx.createImageData(width, height);

  // set our buffer as source
  idata.data.set(buffer);

  // update canvas with new data
  ctx.imageSmoothingEnabled = false;
  ctx.putImageData(idata, 0, 0);
  console.log(frameIdx, players)
})
