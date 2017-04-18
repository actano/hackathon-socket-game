import React from 'react'
import ReactDOM from 'react-dom'

const Player = ({ mySelf, player }) =>
  <li className={`player ${mySelf ? 'player__myself' : ''}`}>
    <div className="player_id">id:{player.id}</div>
    <div className="player_type">{player.playing ? 'player' : 'visitor'}</div>
    <div className="player_pos">pos: { `(${player.position})`}</div>
    <div className="player_head">head: {player.heading}</div>
  </li>

const PlayerList = ({ myId, players }) =>
  <ul className="player-list">
    {players.map(player =>
      <Player
        key={player.id}
        mySelf={myId === player.id}
        player={player}
      />
    )}
  </ul>

const renderPlayerList = (myId, players) =>
  ReactDOM.render(
    <PlayerList
      myId={myId}
      players={players}
    />,
    document.getElementById('players'),
  )

export {
  renderPlayerList,
}
