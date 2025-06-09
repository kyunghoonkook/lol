import React, { useState, useEffect, useRef } from 'react';
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
  const [timeLeft, setTimeLeft] = useState(30);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [auctionHistory, setAuctionHistory] = useState<any[]>([]);
  const [bidCount, setBidCount] = useState<{[playerId: string]: number}>({});
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // 소리 효과 함수
  const playSound = (frequency: number, duration: number = 200) => {
    if (!soundEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContextRef.current.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration / 1000);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
    } catch (error) {
      console.log('사운드 재생 실패:', error);
    }
  };

  // 타이머 시작
  const startTimer = () => {
    setTimeLeft(30);
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endAuction();
          return 0;
        }
        if (prev <= 5) {
          playSound(800, 100); // 경고음
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 경매 시작
  const startAuction = (player: Player) => {
    if (isConnected && socket && !auction.isActive) {
      socket.emit('startAuction', player.id);
      startTimer();
      playSound(440, 300); // 시작음
      setBidCount(prev => ({
        ...prev,
        [player.id]: (prev[player.id] || 0)
      }));
    }
  };

  const startAuctionSequence = () => {
    if (isConnected && socket && !auction.isActive && availablePlayers.length > 0) {
      socket.emit('startAuctionSequence');
      playSound(523, 500); // 시퀀스 시작음
    }
  };

  // 입찰
  const placeBid = (team: 'team1' | 'team2', customAmount?: number) => {
    const amount = customAmount || bidAmount;
    if (isConnected && socket && auction.isActive) {
      socket.emit('placeBid', { team, amount });
      playSound(660, 150); // 입찰음
      setTimeLeft(Math.max(timeLeft, 10)); // 시간 연장
      
             // 입찰 횟수 증가
       if (auction.currentPlayer) {
         const playerId = auction.currentPlayer.id;
         setBidCount(prev => ({
           ...prev,
           [playerId]: (prev[playerId] || 0) + 1
         }));
       }
    }
  };

  // 빠른 입찰 버튼들
  const quickBid = (team: 'team1' | 'team2', type: 'small' | 'medium' | 'max') => {
    let amount = auction.currentBid + 5;
    const teamPoints = auction.teamPoints[team];
    
    switch (type) {
      case 'small':
        amount = auction.currentBid + 10;
        break;
      case 'medium':
        amount = auction.currentBid + 20;
        break;
      case 'max':
        amount = teamPoints;
        break;
    }
    
    if (amount <= teamPoints) {
      placeBid(team, amount);
    }
  };

  // 경매 종료
  const endAuction = () => {
    if (isConnected && socket && auction.isActive) {
      socket.emit('endAuction');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      playSound(220, 500); // 낙찰음
      
      // 히스토리 추가
      if (auction.currentPlayer && auction.currentBidder) {
        const currentPlayer = auction.currentPlayer;
        setAuctionHistory(prev => [...prev, {
          player: currentPlayer,
          team: auction.currentBidder,
          price: auction.currentBid,
          bidCount: bidCount[currentPlayer.id] || 0,
          timestamp: new Date()
        }]);
      }
    }
  };

  // 특별 효과 플레이어 판정
  const getPlayerSpecialEffect = (player: Player) => {
    const hash = player.name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const effectChance = Math.abs(hash) % 100;
    
    if (effectChance < 5) return { type: 'lucky', text: '🍀 럭키 플레이어!', bonus: '+5점 보너스' };
    if (effectChance < 10) return { type: 'cursed', text: '💀 저주받은 플레이어', penalty: '첫 경기 -1킬' };
    if (effectChance < 15) return { type: 'mvp', text: '⭐ MVP 후보', bonus: '캐리 확률 +20%' };
    return null;
  };

  const availablePlayers = players.filter(p => 
    !auction.auctionedPlayers.some(ap => ap.id === p.id)
  );

  useEffect(() => {
    if (auction.isActive && auction.currentPlayer) {
      setBidAmount(auction.currentBid + 5);
    }
  }, [auction.currentBid, auction.isActive]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="auction-display">
      <div className="auction-header">
        <h2>🔨 플레이어 경매</h2>
        <div className="auction-controls">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`sound-toggle ${soundEnabled ? 'enabled' : 'disabled'}`}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>
      
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

      {/* 경매 순서 표시 */}
      {auction.auctionOrder.length > 0 && (
        <div className="auction-sequence">
          <h3>📋 경매 순서</h3>
          <div className="sequence-progress">
            <span>{auction.currentIndex + 1} / {auction.auctionOrder.length}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((auction.currentIndex + 1) / auction.auctionOrder.length) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="sequence-players">
            {auction.auctionOrder.map((player, index) => (
              <div 
                key={player.id} 
                className={`sequence-player ${index === auction.currentIndex ? 'current' : index < auction.currentIndex ? 'completed' : 'upcoming'}`}
              >
                <span className="sequence-number">{index + 1}</span>
                <span className="player-name">{player.name}</span>
                <span className="player-tier">{player.tier}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 현재 경매 상황 */}
      {auction.isActive && auction.currentPlayer ? (
        <div className="current-auction">
          <div className="auction-timer">
            <div className={`timer ${timeLeft <= 5 ? 'warning' : ''} ${timeLeft <= 10 ? 'urgent' : ''}`}>
              ⏰ {timeLeft}초
            </div>
          </div>
          
          <h3>📢 현재 경매 중</h3>
          <div className="auction-player">
            <div className="player-info">
              <h4>{auction.currentPlayer.name}</h4>
              <span className="tier">{auction.currentPlayer.tier}</span>
              <span className="positions">
                {auction.currentPlayer.positions.join(', ')}
              </span>
                              <div className="bid-count">
                  🔥 입찰 횟수: {auction.currentPlayer ? (bidCount[auction.currentPlayer.id] || 0) : 0}
                </div>
              
              {/* 특별 효과 */}
              {(() => {
                const effect = getPlayerSpecialEffect(auction.currentPlayer);
                return effect ? (
                  <div className={`special-effect ${effect.type}`}>
                    <span className="effect-text">{effect.text}</span>
                    <span className="effect-desc">
                      {effect.bonus || effect.penalty}
                    </span>
                  </div>
                ) : null;
              })()}
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
                <div className="team-bids">
                  <div className="team-bid-group">
                    <h5>🔵 팀 1</h5>
                    <div className="quick-bids">
                      <button 
                        onClick={() => quickBid('team1', 'small')}
                        disabled={!isConnected || auction.currentBid + 10 > auction.teamPoints.team1}
                        className="quick-bid-btn small"
                      >
                        +10
                      </button>
                      <button 
                        onClick={() => quickBid('team1', 'medium')}
                        disabled={!isConnected || auction.currentBid + 20 > auction.teamPoints.team1}
                        className="quick-bid-btn medium"
                      >
                        +20
                      </button>
                      <button 
                        onClick={() => quickBid('team1', 'max')}
                        disabled={!isConnected || auction.teamPoints.team1 <= auction.currentBid}
                        className="quick-bid-btn max"
                      >
                        올인
                      </button>
                    </div>
                    <button 
                      onClick={() => placeBid('team1')}
                      disabled={!isConnected || bidAmount > auction.teamPoints.team1}
                      className="bid-btn team1-btn"
                    >
                      {bidAmount}점 입찰
                    </button>
                  </div>
                  
                  <div className="team-bid-group">
                    <h5>🔴 팀 2</h5>
                    <div className="quick-bids">
                      <button 
                        onClick={() => quickBid('team2', 'small')}
                        disabled={!isConnected || auction.currentBid + 10 > auction.teamPoints.team2}
                        className="quick-bid-btn small"
                      >
                        +10
                      </button>
                      <button 
                        onClick={() => quickBid('team2', 'medium')}
                        disabled={!isConnected || auction.currentBid + 20 > auction.teamPoints.team2}
                        className="quick-bid-btn medium"
                      >
                        +20
                      </button>
                      <button 
                        onClick={() => quickBid('team2', 'max')}
                        disabled={!isConnected || auction.teamPoints.team2 <= auction.currentBid}
                        className="quick-bid-btn max"
                      >
                        올인
                      </button>
                    </div>
                    <button 
                      onClick={() => placeBid('team2')}
                      disabled={!isConnected || bidAmount > auction.teamPoints.team2}
                      className="bid-btn team2-btn"
                    >
                      {bidAmount}점 입찰
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={endAuction}
              className="end-auction-btn"
              disabled={!isConnected}
            >
              🔨 낙찰하기
            </button>
          </div>
        </div>
      ) : (
        /* 경매 시작 섹션 */
        <div className="start-auction">
          <div className="auction-start-controls">
            <button
              onClick={startAuctionSequence}
              disabled={!isConnected || availablePlayers.length === 0}
              className="sequence-start-btn"
            >
              🎲 랜덤 순서로 모든 플레이어 경매
            </button>
            <span className="or-divider">또는</span>
          </div>
          <h3>개별 플레이어 경매</h3>
          <div className="available-players">
            {availablePlayers.map(player => {
              const effect = getPlayerSpecialEffect(player);
              return (
                <div key={player.id} className="auction-player-card">
                  <div className="player-details">
                    <h4>{player.name}</h4>
                    <span className="tier">{player.tier}</span>
                    <span className="positions">{player.positions.join(', ')}</span>
                    
                    {effect && (
                      <div className={`special-effect ${effect.type}`}>
                        <span className="effect-text">{effect.text}</span>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => startAuction(player)}
                    disabled={!isConnected}
                    className="start-auction-btn"
                  >
                    🔨 경매 시작
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 경매 히스토리 */}
      {auctionHistory.length > 0 && (
        <div className="auction-history">
          <h3>📊 경매 통계</h3>
          <div className="history-stats">
            <div className="stat">
              <span>총 경매된 플레이어:</span>
              <span>{auctionHistory.length}명</span>
            </div>
            <div className="stat">
              <span>평균 낙찰가:</span>
              <span>{Math.round(auctionHistory.reduce((sum, h) => sum + h.price, 0) / auctionHistory.length)}점</span>
            </div>
            <div className="stat">
              <span>최고 낙찰가:</span>
              <span>{Math.max(...auctionHistory.map(h => h.price))}점</span>
            </div>
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