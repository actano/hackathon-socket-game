import $ from 'jquery'
import io from 'socket.io-client'

const socket = io(window.location.href)
var myId = null;
$('form').submit(function(){
  socket.emit('chat message', { id: myId, msg: $('#m').val() });
  $('#m').val('');
  return false;
});

$('#start-game').click(function() {
  socket.emit('start game', {})
})

socket.on('join', function(clientName){
  if (!myId) myId = clientName
  $('#messages').append($('<li>').text(`client joined: ${clientName}`));
  window.scrollTo(0, document.body.scrollHeight);
});
socket.on('chat message', function(msg){
  $('#messages').append($('<li>').text(`${msg.id}: ${msg.msg}`));
  window.scrollTo(0, document.body.scrollHeight);
});

socket.on('next frame', function(frame) {
  const { frameIdx, world, youAreDead, players } = frame
  console.log(frameIdx, players)
})
