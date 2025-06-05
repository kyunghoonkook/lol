import React from 'react';
import { Player, TeamPosition } from '../App';

interface TeamDisplayProps {
  teams: {
    team1: TeamPosition;
    team2: TeamPosition;
  };
  players: Player[];
  onAssignToTeam: (playerId: string, team: string, position: string) => void;
  onRemoveFromTeam: (team: string, position: string) => void;
}

const positions = [
  { key: 'top', label: '탑', emoji: '🛡️' },
  { key: 'jungle', label: '정글', emoji: '🗡️' },
  { key: 'mid', label: '미드', emoji: '⚡' },
  { key: 'adc', label: '원딜', emoji: '🏹' },
  { key: 'support', label: '서포터', emoji: '🛡️' }
];

const getTierColor = (tier: string) => {
  const tierColors: { [key: string]: string } = {
    'Challenger': '#f0e68c',
    'Grandmaster': '#dc143c',
    'Master': '#9370db',
    'Diamond': '#87ceeb',
    'Emerald': '#50c878',
    'Platinum': '#40e0d0',
    'Gold': '#ffd700',
    'Silver': '#c0c0c0',
    'Bronze': '#cd7f32',
    'Iron': '#8b4513',
    'Unranked': '#808080'
  };
  return tierColors[tier] || '#808080';
};

const TeamDisplay: React.FC<TeamDisplayProps> = ({ 
  teams, 
  players, 
  onAssignToTeam, 
  onRemoveFromTeam 
}) => {
  const getAvailablePlayersForPosition = (position: string) => {
    return players.filter(player => 
      player.positions.includes(position) &&
      !Object.values(teams.team1).some(p => p?.id === player.id) &&
      !Object.values(teams.team2).some(p => p?.id === player.id)
    );
  };

  const renderPositionSlot = (team: string, position: string) => {
    const positionInfo = positions.find(p => p.key === position);
    const teamData = team === 'team1' ? teams.team1 : teams.team2;
    const assignedPlayer = teamData[position as keyof TeamPosition];
    const availablePlayers = getAvailablePlayersForPosition(position);

    return (
      <div key={position} className="position-slot">
        <div className="position-header">
          <span className="position-emoji">{positionInfo?.emoji}</span>
          <span className="position-label">{positionInfo?.label}</span>
        </div>
        
        {assignedPlayer ? (
          <div className="assigned-player">
            <div className="player-card">
              <div className="player-info-header">
                <span className="player-name">{assignedPlayer.name}</span>
                <button 
                  className="remove-player-btn"
                  onClick={() => onRemoveFromTeam(team, position)}
                  title="팀에서 제거"
                >
                  ❌
                </button>
              </div>
              <div 
                className="player-tier-badge"
                style={{ backgroundColor: getTierColor(assignedPlayer.tier) }}
              >
                {assignedPlayer.tier}
              </div>
              <div className="player-score">{assignedPlayer.score}점</div>
            </div>
          </div>
        ) : (
          <div className="empty-slot">
            <div className="slot-placeholder">
              <div className="placeholder-text">플레이어 없음</div>
              {availablePlayers.length > 0 && (
                <div className="available-players">
                  <select 
                    onChange={(e) => {
                      if (e.target.value) {
                        onAssignToTeam(e.target.value, team, position);
                        e.target.value = '';
                      }
                    }}
                    className="player-select"
                    defaultValue=""
                  >
                    <option value="">플레이어 선택...</option>
                    {availablePlayers.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({player.tier})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTeam = (teamKey: string, teamName: string, teamColor: string) => {
    const teamData = teamKey === 'team1' ? teams.team1 : teams.team2;
    const teamScore = Object.values(teamData).reduce((total, player) => 
      total + (player?.score || 0), 0
    );

    return (
      <div className="team-container" style={{ borderColor: teamColor }}>
        <div className="team-header">
          <h3 className="team-name" style={{ color: teamColor }}>
            {teamName}
          </h3>
          <div className="team-score-display">
            총 {teamScore}점
          </div>
        </div>
        
        <div className="team-positions">
          {positions.map(pos => renderPositionSlot(teamKey, pos.key))}
        </div>
      </div>
    );
  };

  return (
    <div className="teams-display">
      <h2>🏆 팀 구성</h2>
      
      <div className="teams-container">
        {renderTeam('team1', '🔵 팀 1', '#2196F3')}
        {renderTeam('team2', '🔴 팀 2', '#F44336')}
      </div>
      
      {players.length > 0 && (
        <div className="unassigned-players">
          <h4>⏳ 배정되지 않은 플레이어</h4>
          <div className="unassigned-list">
            {players
              .filter(player => 
                !Object.values(teams.team1).some(p => p?.id === player.id) &&
                !Object.values(teams.team2).some(p => p?.id === player.id)
              )
              .map(player => (
                <div key={player.id} className="unassigned-player">
                  <span className="player-name">{player.name}</span>
                  <span 
                    className="player-tier-small"
                    style={{ backgroundColor: getTierColor(player.tier) }}
                  >
                    {player.tier}
                  </span>
                  <div className="player-positions-small">
                    {player.positions.map(pos => {
                      const posInfo = positions.find(p => p.key === pos);
                      return (
                        <span key={pos} className="position-small">
                          {posInfo?.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDisplay; 