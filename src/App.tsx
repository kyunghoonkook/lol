import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import PlayerForm from './components/PlayerForm';
import PlayerList from './components/PlayerList';
import TeamDisplay from './components/TeamDisplay';
import AuctionDisplay from './components/AuctionDisplay';
import './App.css';

// 배포 환경에 따른 서버 URL 설정
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5001';

export interface Player {
  id: string;
  name: string;
  tier: string;
  positions: string[];
  score: number;
  addedBy?: string;
}

export interface TeamPosition {
  top: Player | null;
  jungle: Player | null;
  mid: Player | null;
  adc: Player | null;
  support: Player | null;
}

export interface AuctionState {
  isActive: boolean;
  currentPlayer: Player | null;
  currentBid: number;
  currentBidder: string | null;
  teamPoints: {
    team1: number;
    team2: number;
  };
  auctionedPlayers: (Player & { team: string; price: number })[];
  timer: number;
  auctionOrder: Player[];
  currentIndex: number;
}

export interface GameState {
  players: Player[];
  teams: {
    team1: TeamPosition;
    team2: TeamPosition;
  };
  auction: AuctionState;
  lastModified: number;
}

function App() {
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    teams: {
      team1: { top: null, jungle: null, mid: null, adc: null, support: null },
      team2: { top: null, jungle: null, mid: null, adc: null, support: null }
    },
    auction: {
      isActive: false,
      currentPlayer: null,
      currentBid: 0,
      currentBidder: null,
      teamPoints: { team1: 100, team2: 100 },
      auctionedPlayers: [],
      timer: 0,
      auctionOrder: [],
      currentIndex: 0
    },
    lastModified: Date.now()
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'team' | 'auction'>('team');

  useEffect(() => {
    try {
      const newSocket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('실시간 연결 성공!');
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('실시간 연결 끊어짐');
      });

      newSocket.on('gameState', (newGameState: GameState) => {
        setGameState(newGameState);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } catch (error) {
      console.log('오프라인 모드로 실행');
      setIsConnected(false);
    }
  }, []);

  // 로컬 상태 관리 함수들 (오프라인 모드용)
  const addPlayerLocal = (playerData: Omit<Player, 'id' | 'score' | 'addedBy'>) => {
    const newPlayer: Player = {
      ...playerData,
      id: Date.now().toString(),
      score: getTierScore(playerData.tier),
      addedBy: 'local'
    };
    
    setGameState(prev => ({
      ...prev,
      players: [...prev.players, newPlayer],
      lastModified: Date.now()
    }));
  };

  const removePlayerLocal = (playerId: string) => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== playerId),
      lastModified: Date.now()
    }));
  };

  const assignToTeamLocal = (playerId: string, team: string, position: string) => {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;

    setGameState(prev => ({
      ...prev,
      teams: {
        ...prev.teams,
        [team]: {
          ...prev.teams[team as keyof typeof prev.teams],
          [position]: player
        }
      },
      lastModified: Date.now()
    }));
  };

  const removeFromTeamLocal = (team: string, position: string) => {
    setGameState(prev => ({
      ...prev,
      teams: {
        ...prev.teams,
        [team]: {
          ...prev.teams[team as keyof typeof prev.teams],
          [position]: null
        }
      },
      lastModified: Date.now()
    }));
  };

  // 티어 점수 계산
  const getTierScore = (tier: string): number => {
    const tierScores: { [key: string]: number } = {
      '챌린저': 10, '그랜드마스터': 9, '마스터': 8, '다이아몬드': 7,
      '에메랄드': 6, '플래티넘': 5, '골드': 4, '실버': 3, '브론즈': 2, '아이언': 1
    };
    return tierScores[tier] || 5;
  };

  // 서버 연결 상태에 따른 함수 선택
  const addPlayer = (playerData: Omit<Player, 'id' | 'score' | 'addedBy'>) => {
    if (isConnected && socket) {
      socket.emit('addPlayer', playerData);
    } else {
      addPlayerLocal(playerData);
    }
  };

  const updatePlayer = (playerData: Player) => {
    if (isConnected && socket) {
      socket.emit('updatePlayer', playerData);
    } else {
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => p.id === playerData.id ? playerData : p),
        lastModified: Date.now()
      }));
    }
  };

  const removePlayer = (playerId: string) => {
    if (isConnected && socket) {
      socket.emit('removePlayer', playerId);
    } else {
      removePlayerLocal(playerId);
    }
  };

  const assignToTeam = (playerId: string, team: string, position: string) => {
    if (isConnected && socket) {
      socket.emit('assignToTeam', { playerId, team, position });
    } else {
      assignToTeamLocal(playerId, team, position);
    }
  };

  const removeFromTeam = (team: string, position: string) => {
    if (isConnected && socket) {
      socket.emit('removeFromTeam', { team, position });
    } else {
      removeFromTeamLocal(team, position);
    }
  };

  const autoBalance = () => {
    if (isConnected && socket) {
      socket.emit('autoBalance');
    } else {
      // 로컬 자동 밸런싱 알고리즘 (중복 방지)
      autoBalanceLocal();
    }
  };

  // 로컬 자동 밸런싱 함수
  const autoBalanceLocal = () => {
    const availablePlayers = gameState.players.filter(player => {
      // 이미 팀에 배치된 선수는 제외
      const isInTeam1 = Object.values(gameState.teams.team1).some(p => p?.id === player.id);
      const isInTeam2 = Object.values(gameState.teams.team2).some(p => p?.id === player.id);
      return !isInTeam1 && !isInTeam2;
    });

    if (availablePlayers.length === 0) {
      alert('배치할 수 있는 선수가 없습니다.');
      return;
    }

    // 팀 초기화
    const newTeams = {
      team1: { top: null, jungle: null, mid: null, adc: null, support: null },
      team2: { top: null, jungle: null, mid: null, adc: null, support: null }
    };

    // 포지션별로 선수 분류
    const positionPlayers: { [key: string]: Player[] } = {
      top: [],
      jungle: [],
      mid: [],
      adc: [],
      support: []
    };

    availablePlayers.forEach(player => {
      player.positions.forEach(position => {
        if (positionPlayers[position]) {
          positionPlayers[position].push(player);
        }
      });
    });

    // 각 포지션별로 점수 순으로 정렬
    Object.keys(positionPlayers).forEach(position => {
      positionPlayers[position].sort((a, b) => b.score - a.score);
    });

    const usedPlayers = new Set<string>(); // 중복 방지를 위한 Set
    const positions = ['top', 'jungle', 'mid', 'adc', 'support'];

    // 각 포지션에 대해 균형잡힌 배치
    positions.forEach(position => {
      const availableForPosition = positionPlayers[position].filter(p => !usedPlayers.has(p.id));
      
      if (availableForPosition.length >= 2) {
        // 점수가 높은 선수를 team1에, 두 번째로 높은 선수를 team2에
        const team1Player = availableForPosition[0];
        const team2Player = availableForPosition[1];
        
        (newTeams.team1 as any)[position] = team1Player;
        (newTeams.team2 as any)[position] = team2Player;
        
        usedPlayers.add(team1Player.id);
        usedPlayers.add(team2Player.id);
      } else if (availableForPosition.length === 1) {
        // 한 명만 있는 경우 점수가 낮은 팀에 배치
        const team1Score = calculateTeamScore(newTeams.team1);
        const team2Score = calculateTeamScore(newTeams.team2);
        
        if (team1Score <= team2Score) {
          (newTeams.team1 as any)[position] = availableForPosition[0];
        } else {
          (newTeams.team2 as any)[position] = availableForPosition[0];
        }
        
        usedPlayers.add(availableForPosition[0].id);
      }
    });

    // 남은 선수들을 균형에 맞춰 배치
    const remainingPlayers = availablePlayers.filter(p => !usedPlayers.has(p.id));
    remainingPlayers.sort((a, b) => b.score - a.score);

    remainingPlayers.forEach(player => {
      const team1Score = calculateTeamScore(newTeams.team1);
      const team2Score = calculateTeamScore(newTeams.team2);
      
      // 빈 포지션 찾기
      const emptyPositions1 = positions.filter(pos => 
        !newTeams.team1[pos as keyof TeamPosition] && 
        player.positions.includes(pos)
      );
      const emptyPositions2 = positions.filter(pos => 
        !newTeams.team2[pos as keyof TeamPosition] && 
        player.positions.includes(pos)
      );

      if (team1Score <= team2Score && emptyPositions1.length > 0) {
        (newTeams.team1 as any)[emptyPositions1[0]] = player;
      } else if (emptyPositions2.length > 0) {
        (newTeams.team2 as any)[emptyPositions2[0]] = player;
      }
    });

    // 상태 업데이트
    setGameState(prev => ({
      ...prev,
      teams: newTeams,
      lastModified: Date.now()
    }));

    // 결과 알림
    const finalTeam1Score = calculateTeamScore(newTeams.team1);
    const finalTeam2Score = calculateTeamScore(newTeams.team2);
    const balanceDiff = Math.abs(finalTeam1Score - finalTeam2Score);
    
    const balanceMessage = balanceDiff <= 2 ? '균형잡힌' : balanceDiff <= 5 ? '보통' : '불균형한';
    alert(`자동 밸런싱 완료!\n팀 1: ${finalTeam1Score}점\n팀 2: ${finalTeam2Score}점\n상태: ${balanceMessage} 팀`);
  };

  const resetGame = () => {
    if (window.confirm('게임을 초기화하시겠습니까? 모든 데이터가 삭제됩니다.')) {
      if (isConnected && socket) {
        socket.emit('resetGame');
      } else {
        setGameState({
          players: [],
          teams: {
            team1: { top: null, jungle: null, mid: null, adc: null, support: null },
            team2: { top: null, jungle: null, mid: null, adc: null, support: null }
          },
          auction: {
            isActive: false,
            currentPlayer: null,
            currentBid: 0,
            currentBidder: null,
            teamPoints: { team1: 100, team2: 100 },
            auctionedPlayers: [],
            timer: 0,
            auctionOrder: [],
            currentIndex: 0
          },
          lastModified: Date.now()
        });
      }
    }
  };

  const calculateTeamScore = (team: TeamPosition) => {
    return Object.values(team).reduce((total, player) => {
      return total + (player?.score || 0);
    }, 0);
  };

  const team1Score = calculateTeamScore(gameState.teams.team1);
  const team2Score = calculateTeamScore(gameState.teams.team2);

  return (
    <div className="App">
      <header className="app-header">
        <h1>🎮 내전 팀짜기 -경훈-</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'offline'}`}>
            {isConnected ? '🟢 실시간 연결' : '🔴 오프라인 모드'}
          </span>
        </div>
        
        {/* 탭 네비게이션 */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            ⚖️ 팀 밸런싱
          </button>
          <button 
            className={`tab-btn ${activeTab === 'auction' ? 'active' : ''}`}
            onClick={() => setActiveTab('auction')}
          >
            🔨 플레이어 경매
          </button>
        </div>

        <div className="header-info">
          <span className="player-count">플레이어: {gameState.players.length}명</span>
          <div className="action-buttons">
            {activeTab === 'team' && (
              <button 
                className="auto-balance-btn"
                onClick={autoBalance}
                disabled={gameState.players.length < 2}
              >
                ⚖️ 자동 밸런싱
              </button>
            )}
            <button 
              className="reset-btn"
              onClick={resetGame}
            >
              🔄 초기화
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="left-panel">
          <PlayerForm onAddPlayer={addPlayer} />
          <PlayerList 
            players={gameState.players}
            onUpdatePlayer={updatePlayer}
            onRemovePlayer={removePlayer}
          />
        </div>

        <div className="right-panel">
          {activeTab === 'team' ? (
            <>
              <div className="balance-indicator">
                <div className="team-scores">
                  <span className={`team-score ${team1Score > team2Score ? 'stronger' : team1Score < team2Score ? 'weaker' : 'balanced'}`}>
                    팀 1: {team1Score}점
                  </span>
                  <span className="vs">VS</span>
                  <span className={`team-score ${team2Score > team1Score ? 'stronger' : team2Score < team1Score ? 'weaker' : 'balanced'}`}>
                    팀 2: {team2Score}점
                  </span>
                </div>
                <div className="balance-status">
                  {Math.abs(team1Score - team2Score) <= 2 && team1Score > 0 && team2Score > 0
                    ? '⚖️ 균형잡힌 팀'
                    : Math.abs(team1Score - team2Score) > 5
                    ? '⚠️ 불균형한 팀'
                    : '📊 보통 균형'
                  }
                </div>
              </div>

              <TeamDisplay
                teams={gameState.teams}
                players={gameState.players}
                onAssignToTeam={assignToTeam}
                onRemoveFromTeam={removeFromTeam}
              />
            </>
          ) : (
            <AuctionDisplay
              auction={gameState.auction}
              players={gameState.players}
              isConnected={isConnected}
              socket={socket}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
