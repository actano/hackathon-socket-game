import React from 'react'
import ReactDOM from 'react-dom'

const Player = ({ player }) =>
  <li className="player">
    <div className="player_id">id:{player.id}</div>
    <div className="player_type">{player.playing ? 'player' : 'visitor'}</div>
    <div className="player_pos">pos: { `(${player.position})`}</div>
    <div className="player_head">head: {player.heading}</div>
  </li>

const PlayerList = ({ players }) =>
  <ul className="player-list">
    {players.map(player => <Player key={player.id} player={player} />)}
  </ul>

const renderPlayerList = (players) =>
  ReactDOM.render(
    <PlayerList players={players} />,
    document.getElementById('players'),
  )

export {
  renderPlayerList,
}
