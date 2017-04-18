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

socket.on('join', function(playerId){
  if (!myId) {
    myId = playerId
    console.log(myId)
  }
  $('#messages').append($('<li>').text(`client joined: ${playerId}`));
  window.scrollTo(0, document.body.scrollHeight);
});
socket.on('chat message', function(msg){
  $('#messages').append($('<li>').text(`${msg.id}: ${msg.msg}`));
  window.scrollTo(0, document.body.scrollHeight);
});

socket.on('next frame', function(frame) {
  const { frameIdx, world, youAreDead, players } = frame
  const myself = players.find(p => (p.id === myId))
  console.log(frameIdx, myself.position, 'dead?', youAreDead)
})
