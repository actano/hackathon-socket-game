import React from 'react'
import ReactDOM from 'react-dom'

const Player = ({ mySelf, player }) =>
  <tbody>
    <tr
      className={`player ${mySelf ? 'player__myself' : ''}`}
    >
      <td
        className="player_color"
        style={{backgroundColor: `rgb(${player.color})`}}
      >
        <span style={{color: '#fff'}}>{ mySelf ? 'X' : '' }</span>
        <span style={{color: '#000'}}>{ mySelf ? 'X' : '' }</span>
      </td>
      <td className="player_name">
        {player.name}
      </td>
      <td className="player_id">
        {player.id}
      </td>
      <td className="player_type">
        {player.playing ? 'alive' : 'dead'}
      </td>
      <td className="player_pos">
        { `(${player.position})`}
      </td>
      <td className="player_head">
        {player.heading}
      </td>
    </tr>
  </tbody>

const PlayerList = ({ myId, players }) =>
  <table className="player-list">
    <thead>
      <tr>
        <th>color</th>
        <th>name</th>
        <th>id</th>
        <th>status</th>
        <th>pos</th>
        <th>direction</th>
      </tr>
    </thead>
    {players.map(player =>
      <Player
        key={player.id}
        mySelf={myId === player.id}
        player={player}
      />
    )}
  </table>

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
