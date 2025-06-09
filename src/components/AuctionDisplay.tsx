import React, { useState, useEffect } from 'react';
import { Player, AuctionState } from '../App';

interface AuctionDisplayProps {
  auction: AuctionState;
  players: Player[];
  isConnected: boolean;
  socket: any;
}

const AuctionDisplay: React.FC<AuctionDisplayProps> = ({ 
  auction, 
  players, 
  isConnected, 
  socket 
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [bidAmount, setBidAmount] = useState(10);

  const startAuction = (player: Player) => {
    if (isConnected && socket && !auction.isActive) {
      socket.emit('startAuction', player.id);
    }
  };

  const placeBid = (team: 'team1' | 'team2') => {
    if (isConnected && socket && auction.isActive) {
      socket.emit('placeBid', { team, amount: bidAmount });
    }
  };

  const endAuction = () => {
    if (isConnected && socket && auction.isActive) {
      socket.emit('endAuction');
    }
  };

  const availablePlayers = players.filter(p => 
    !auction.auctionedPlayers.some(ap => ap.id === p.id)
  );

  useEffect(() => {
    if (auction.isActive && auction.currentPlayer) {
      setBidAmount(auction.currentBid + 5);
    }
  }, [auction.currentBid, auction.isActive]);

  return (
    <div className="auction-display">
      <h2>🔨 플레이어 경매</h2>
      
      {/* 팀 포인트 표시 */}
      <div className="team-points">
        <div className="team-point">
          <span className="team-name">🔵 팀 1</span>
          <span className="points">{auction.teamPoints.team1}점</span>
        </div>
        <div className="team-point">
          <span className="team-name">🔴 팀 2</span>
          <span className="points">{auction.teamPoints.team2}점</span>
        </div>
      </div>

      {/* 현재 경매 상황 */}
      {auction.isActive && auction.currentPlayer ? (
        <div className="current-auction">
          <h3>📢 현재 경매 중</h3>
          <div className="auction-player">
            <div className="player-info">
              <h4>{auction.currentPlayer.name}</h4>
              <span className="tier">{auction.currentPlayer.tier}</span>
              <span className="positions">
                {auction.currentPlayer.positions.join(', ')}
              </span>
            </div>
            <div className="current-bid">
              <div className="bid-amount">현재 입찰가: {auction.currentBid}점</div>
              <div className="current-bidder">
                {auction.currentBidder ? 
                  `${auction.currentBidder === 'team1' ? '🔵 팀 1' : '🔴 팀 2'}이 최고가` : 
                  '입찰자 없음'
                }
              </div>
            </div>
          </div>

          {/* 입찰 섹션 */}
          <div className="bidding-section">
            <div className="bid-controls">
              <input 
                type="number" 
                value={bidAmount}
                min={auction.currentBid + 5}
                step={5}
                onChange={(e) => setBidAmount(Number(e.target.value))}
              />
              <div className="bid-buttons">
                <button 
                  onClick={() => placeBid('team1')}
                  disabled={!isConnected || bidAmount > auction.teamPoints.team1}
                  className="bid-btn team1-btn"
                >
                  🔵 팀 1 입찰
                </button>
                <button 
                  onClick={() => placeBid('team2')}
                  disabled={!isConnected || bidAmount > auction.teamPoints.team2}
                  className="bid-btn team2-btn"
                >
                  🔴 팀 2 입찰
                </button>
              </div>
            </div>
            <button 
              onClick={endAuction}
              className="end-auction-btn"
              disabled={!isConnected}
            >
              낙찰하기
            </button>
          </div>
        </div>
      ) : (
        /* 경매 시작 섹션 */
        <div className="start-auction">
          <h3>경매할 플레이어 선택</h3>
          <div className="available-players">
            {availablePlayers.map(player => (
              <div key={player.id} className="auction-player-card">
                <div className="player-details">
                  <h4>{player.name}</h4>
                  <span className="tier">{player.tier}</span>
                  <span className="positions">{player.positions.join(', ')}</span>
                </div>
                <button 
                  onClick={() => startAuction(player)}
                  disabled={!isConnected}
                  className="start-auction-btn"
                >
                  경매 시작
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 경매된 플레이어들 */}
      {auction.auctionedPlayers.length > 0 && (
        <div className="auctioned-players">
          <h3>📋 경매 완료된 플레이어들</h3>
          <div className="auctioned-list">
            {auction.auctionedPlayers.map(player => (
              <div key={player.id} className="auctioned-player">
                <div className="player-info">
                  <span className="name">{player.name}</span>
                  <span className="tier">{player.tier}</span>
                </div>
                <div className="auction-result">
                  <span className={`team ${player.team}`}>
                    {player.team === 'team1' ? '🔵 팀 1' : '🔴 팀 2'}
                  </span>
                  <span className="price">{player.price}점</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionDisplay; 