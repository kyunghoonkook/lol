import React, { useState } from 'react';
import { Player } from '../App';

interface PlayerListProps {
  players: Player[];
  onUpdatePlayer: (player: Player) => void;
  onRemovePlayer: (playerId: string) => void;
}

const tiers = [
  'Challenger', 'Grandmaster', 'Master', 'Diamond', 
  'Emerald', 'Platinum', 'Gold', 'Silver', 'Bronze', 'Iron', 'Unranked'
];

const positions = [
  { key: 'top', label: '탑' },
  { key: 'jungle', label: '정글' },
  { key: 'mid', label: '미드' },
  { key: 'adc', label: '원딜' },
  { key: 'support', label: '서포터' }
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

const PlayerList: React.FC<PlayerListProps> = ({ players, onUpdatePlayer, onRemovePlayer }) => {
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Player>>({});

  const startEdit = (player: Player) => {
    setEditingPlayer(player.id);
    setEditForm({ ...player });
  };

  const cancelEdit = () => {
    setEditingPlayer(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (editForm.name && editForm.tier && editForm.positions && editingPlayer) {
      onUpdatePlayer(editForm as Player);
      setEditingPlayer(null);
      setEditForm({});
    }
  };

  const handlePositionChange = (position: string) => {
    setEditForm(prev => ({
      ...prev,
      positions: prev.positions?.includes(position)
        ? prev.positions.filter(p => p !== position)
        : [...(prev.positions || []), position]
    }));
  };

  if (players.length === 0) {
    return (
      <div className="player-list-container">
        <h3>📋 플레이어 목록</h3>
        <div className="empty-state">
          <p>등록된 플레이어가 없습니다.</p>
          <p>위에서 플레이어를 추가해보세요!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="player-list-container">
      <h3>📋 플레이어 목록 ({players.length}명)</h3>
      <div className="player-list">
        {players.map(player => (
          <div key={player.id} className="player-item">
            {editingPlayer === player.id ? (
              <div className="player-edit-form">
                <div className="edit-row">
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="edit-input"
                    placeholder="플레이어 이름"
                  />
                  <select
                    value={editForm.tier || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tier: e.target.value }))}
                    className="edit-select"
                  >
                    {tiers.map(tier => (
                      <option key={tier} value={tier}>{tier}</option>
                    ))}
                  </select>
                </div>
                
                <div className="edit-positions">
                  {positions.map(position => (
                    <label key={position.key} className="edit-checkbox-label">
                      <input
                        type="checkbox"
                        checked={editForm.positions?.includes(position.key) || false}
                        onChange={() => handlePositionChange(position.key)}
                      />
                      <span>{position.label}</span>
                    </label>
                  ))}
                </div>
                
                <div className="edit-actions">
                  <button onClick={saveEdit} className="save-btn">저장</button>
                  <button onClick={cancelEdit} className="cancel-btn">취소</button>
                </div>
              </div>
            ) : (
              <div className="player-info">
                <div className="player-header">
                  <div className="player-name">{player.name}</div>
                  <div 
                    className="player-tier"
                    style={{ backgroundColor: getTierColor(player.tier) }}
                  >
                    {player.tier}
                  </div>
                  <div className="player-score">{player.score}점</div>
                </div>
                
                <div className="player-positions">
                  {player.positions.map(pos => {
                    const positionInfo = positions.find(p => p.key === pos);
                    return (
                      <span key={pos} className="position-tag">
                        {positionInfo?.label || pos}
                      </span>
                    );
                  })}
                </div>
                
                <div className="player-actions">
                  <button 
                    onClick={() => startEdit(player)}
                    className="edit-btn"
                  >
                    ✏️ 수정
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm(`${player.name} 플레이어를 삭제하시겠습니까?`)) {
                        onRemovePlayer(player.id);
                      }
                    }}
                    className="delete-btn"
                  >
                    🗑️ 삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerList; 