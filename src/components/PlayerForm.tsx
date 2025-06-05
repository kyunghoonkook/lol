import React, { useState } from 'react';
import { Player } from '../App';

interface PlayerFormProps {
  onAddPlayer: (playerData: Omit<Player, 'id' | 'score' | 'addedBy'>) => void;
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

const PlayerForm: React.FC<PlayerFormProps> = ({ onAddPlayer }) => {
  const [name, setName] = useState('');
  const [tier, setTier] = useState('Gold');
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const handlePositionChange = (position: string) => {
    setSelectedPositions(prev => 
      prev.includes(position)
        ? prev.filter(p => p !== position)
        : [...prev, position]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('플레이어 이름을 입력해주세요.');
      return;
    }
    
    if (selectedPositions.length === 0) {
      alert('최소 하나의 포지션을 선택해주세요.');
      return;
    }

    onAddPlayer({
      name: name.trim(),
      tier,
      positions: selectedPositions
    });

    // 폼 초기화
    setName('');
    setTier('Gold');
    setSelectedPositions([]);
    setIsFormVisible(false);
  };

  return (
    <div className="player-form-container">
      <div className="form-header">
        <h2>👤 플레이어 관리</h2>
        <button 
          className="toggle-form-btn"
          onClick={() => setIsFormVisible(!isFormVisible)}
        >
          {isFormVisible ? '➖ 숨기기' : '➕ 플레이어 추가'}
        </button>
      </div>

      {isFormVisible && (
        <form onSubmit={handleSubmit} className="player-form">
          <div className="form-group">
            <label htmlFor="playerName">플레이어 이름</label>
            <input
              id="playerName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="소환사명을 입력하세요"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="playerTier">티어</label>
            <select
              id="playerTier"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="form-select"
            >
              {tiers.map(tierOption => (
                <option key={tierOption} value={tierOption}>
                  {tierOption}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>가능한 포지션</label>
            <div className="position-checkboxes">
              {positions.map(position => (
                <label key={position.key} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedPositions.includes(position.key)}
                    onChange={() => handlePositionChange(position.key)}
                  />
                  <span className="checkbox-text">{position.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn">
              플레이어 추가
            </button>
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => setIsFormVisible(false)}
            >
              취소
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PlayerForm; 