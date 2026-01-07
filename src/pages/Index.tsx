import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import GameSettings from '@/components/GameSettings';
import GameGrid from '@/components/GameGrid';
import GameSidebar from '@/components/GameSidebar';

type CellState = 'hidden' | 'revealed' | 'flagged' | 'bomb';

interface Cell {
  id: number;
  state: CellState;
  isBomb: boolean;
  probability: number;
  neighbors: number;
}

interface GameStats {
  gamesPlayed: number;
  wins: number;
  currentStreak: number;
  bestStreak: number;
  totalProfit: number;
}

const GRID_SIZE = 5;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

const getMultiplier = (bombCount: number, safeCellsRevealed: number): number => {
  const safeCells = TOTAL_CELLS - bombCount;
  const baseMultiplier = Math.pow(safeCells / (safeCells - safeCellsRevealed + 1), 1.5);
  const bombMultiplier = 1 + (bombCount / TOTAL_CELLS) * 2;
  return Number((baseMultiplier * bombMultiplier).toFixed(2));
};

const Index = () => {
  const [grid, setGrid] = useState<Cell[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [bombCount, setBombCount] = useState(2);
  const [betAmount, setBetAmount] = useState(100);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stats, setStats] = useState<GameStats>({
    gamesPlayed: 0,
    wins: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalProfit: 0,
  });
  const [showProbabilities, setShowProbabilities] = useState(true);
  const [revealedCount, setRevealedCount] = useState(0);

  const getNeighbors = (index: number): number[] => {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    const neighbors: number[] = [];

    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        if (r === 0 && c === 0) continue;
        const newRow = row + r;
        const newCol = col + c;
        if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
          neighbors.push(newRow * GRID_SIZE + newCol);
        }
      }
    }

    return neighbors;
  };

  const calculateProbabilities = (currentGrid: Cell[]) => {
    const newGrid = [...currentGrid];
    const hiddenCells = newGrid.filter(c => c.state === 'hidden');
    const totalHidden = hiddenCells.length;
    const bombsRemaining = bombCount - newGrid.filter(c => c.state === 'revealed' && c.isBomb).length;
    
    newGrid.forEach((cell, idx) => {
      if (cell.state === 'revealed') {
        cell.probability = cell.isBomb ? 0 : 100;
        return;
      }

      if (cell.state === 'hidden') {
        // С точностью 97% показываем где бомбы
        if (cell.isBomb) {
          // Бомбы отображаются с вероятностью 3% (низкий шанс безопасности)
          cell.probability = Math.floor(Math.random() * 4); // 0-3%
        } else {
          // Безопасные ячейки показываем с вероятностью 97-99%
          const baseProbability = ((totalHidden - bombsRemaining) / totalHidden) * 100;
          
          const neighbors = getNeighbors(idx);
          const revealedNeighbors = neighbors.filter(n => newGrid[n].state === 'revealed' && !newGrid[n].isBomb);
          
          let bombProximityScore = 0;
          revealedNeighbors.forEach(n => {
            const revealedCell = newGrid[n];
            if (revealedCell.neighbors === 0) {
              bombProximityScore += 15;
            } else {
              bombProximityScore -= revealedCell.neighbors * 8;
            }
          });

          const revealedSafeCells = newGrid.filter(c => c.state === 'revealed' && !c.isBomb).length;
          const positionBonus = revealedSafeCells > 0 ? 5 : 0;

          const finalProbability = Math.min(99, Math.max(97, baseProbability + bombProximityScore + positionBonus));
          cell.probability = Math.round(finalProbability);
        }
      }
    });

    setGrid(newGrid);
  };

  const initializeGrid = () => {
    const newGrid: Cell[] = [];
    const bombPositions = new Set<number>();

    while (bombPositions.size < bombCount) {
      bombPositions.add(Math.floor(Math.random() * TOTAL_CELLS));
    }

    for (let i = 0; i < TOTAL_CELLS; i++) {
      newGrid.push({
        id: i,
        state: 'hidden',
        isBomb: bombPositions.has(i),
        probability: 0,
        neighbors: 0,
      });
    }

    newGrid.forEach((cell, idx) => {
      if (!cell.isBomb) {
        const neighbors = getNeighbors(idx);
        cell.neighbors = neighbors.filter(n => newGrid[n].isBomb).length;
      }
    });

    setGrid(newGrid);
    setGameOver(false);
    setGameWon(false);
    setRevealedCount(0);
    setIsPlaying(true);
    setCurrentMultiplier(1.0);
    calculateProbabilities(newGrid);
  };

  useEffect(() => {
    const newGrid: Cell[] = [];
    for (let i = 0; i < TOTAL_CELLS; i++) {
      newGrid.push({
        id: i,
        state: 'hidden',
        isBomb: false,
        probability: 0,
        neighbors: 0,
      });
    }
    setGrid(newGrid);
  }, []);

  const revealCell = (index: number) => {
    if (gameOver || gameWon || grid[index].state !== 'hidden' || !isPlaying) return;

    const newGrid = [...grid];
    const cell = newGrid[index];

    if (cell.isBomb) {
      cell.state = 'revealed';
      setGrid(newGrid);
      setGameOver(true);
      setIsPlaying(false);
      
      const loss = -betAmount;
      setStats(prev => ({
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        currentStreak: 0,
        totalProfit: prev.totalProfit + loss,
      }));
      
      toast.error('💥 Бомба! Игра окончена', {
        description: `Потеряно: ${betAmount} ₽`,
      });
      return;
    }

    cell.state = 'revealed';
    const newRevealedCount = revealedCount + 1;
    setRevealedCount(newRevealedCount);

    const newMultiplier = getMultiplier(bombCount, newRevealedCount);
    setCurrentMultiplier(newMultiplier);

    const safeCount = TOTAL_CELLS - bombCount;
    if (newRevealedCount === safeCount) {
      setGameWon(true);
      setIsPlaying(false);
      const newStreak = stats.currentStreak + 1;
      const profit = Math.round(betAmount * newMultiplier - betAmount);
      setStats(prev => ({
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        wins: prev.wins + 1,
        currentStreak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        totalProfit: prev.totalProfit + profit,
      }));
      toast.success('🏆 Победа! Все безопасные ячейки открыты!', {
        description: `Выигрыш: ${Math.round(betAmount * newMultiplier)} ₽ (×${newMultiplier})`,
      });
    } else {
      toast.success(`✨ Безопасно! Множитель ×${newMultiplier}`);
    }

    setGrid(newGrid);
    calculateProbabilities(newGrid);
  };

  const cashOut = () => {
    if (!isPlaying || revealedCount === 0) return;
    
    setGameWon(true);
    setIsPlaying(false);
    const newStreak = stats.currentStreak + 1;
    const profit = Math.round(betAmount * currentMultiplier - betAmount);
    setStats(prev => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      wins: prev.wins + 1,
      currentStreak: newStreak,
      bestStreak: Math.max(prev.bestStreak, newStreak),
      totalProfit: prev.totalProfit + profit,
    }));
    toast.success('💰 Вывод средств!', {
      description: `Выигрыш: ${Math.round(betAmount * currentMultiplier)} ₽ (×${currentMultiplier})`,
    });
  };

  const getCellColor = (cell: Cell) => {
    if (cell.state === 'revealed') {
      if (cell.isBomb) return 'bg-red-900 border-red-600';
      return 'bg-gradient-to-br from-emerald-900 to-emerald-800 border-emerald-600';
    }
    // Бомбы подсвечиваем красным
    if (cell.probability <= 5) return 'bg-gradient-to-br from-red-900/50 to-red-800/50 border-red-700/50';
    if (cell.probability >= 80) return 'bg-gradient-to-br from-green-900/40 to-green-800/40 border-green-700/50 gold-glow';
    if (cell.probability >= 60) return 'bg-gradient-to-br from-yellow-900/40 to-yellow-800/40 border-yellow-700/50';
    if (cell.probability >= 40) return 'bg-gradient-to-br from-orange-900/40 to-orange-800/40 border-orange-700/50';
    return 'bg-gradient-to-br from-[#1A1625] to-[#0f0b14] border-[#2a2435]';
  };

  const getRecommendation = () => {
    if (!isPlaying) return null;
    
    const hiddenCells = grid.filter(c => c.state === 'hidden' && !c.isBomb);
    if (hiddenCells.length === 0) return null;
    
    const sortedCells = hiddenCells.sort((a, b) => {
      if (b.probability !== a.probability) {
        return b.probability - a.probability;
      }
      
      const aNeighbors = getNeighbors(a.id);
      const bNeighbors = getNeighbors(b.id);
      const aSafeNeighbors = aNeighbors.filter(n => grid[n].state === 'revealed' && !grid[n].isBomb).length;
      const bSafeNeighbors = bNeighbors.filter(n => grid[n].state === 'revealed' && !grid[n].isBomb).length;
      
      return bSafeNeighbors - aSafeNeighbors;
    });
    
    return sortedCells[0];
  };

  const recommendation = getRecommendation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#1A1625] to-[#0A0A0F] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 text-gold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            1WIN MINES PREDICTOR
          </h1>
          <p className="text-muted-foreground text-lg" style={{ fontFamily: 'Roboto, sans-serif' }}>
            Умный анализ вероятностей для игры Mines
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-card to-secondary border-2 border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Игр сыграно</span>
              <Icon name="TrendingUp" size={20} className="text-accent" />
            </div>
            <p className="text-3xl font-bold text-gold">{stats.gamesPlayed}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-secondary border-2 border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Процент побед</span>
              <Icon name="Award" size={20} className="text-accent" />
            </div>
            <p className="text-3xl font-bold text-gold">
              {stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0}%
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-secondary border-2 border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Лучшая серия</span>
              <Icon name="Flame" size={20} className="text-accent" />
            </div>
            <p className="text-3xl font-bold text-gold">{stats.bestStreak}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-secondary border-2 border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Общая прибыль</span>
              <Icon name="DollarSign" size={20} className="text-accent" />
            </div>
            <p className={`text-3xl font-bold ${stats.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit} ₽
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {!isPlaying && (
              <GameSettings
                betAmount={betAmount}
                setBetAmount={setBetAmount}
                bombCount={bombCount}
                setBombCount={setBombCount}
                onStartGame={initializeGrid}
              />
            )}

            <GameGrid
              grid={grid}
              isPlaying={isPlaying}
              gameOver={gameOver}
              gameWon={gameWon}
              showProbabilities={showProbabilities}
              setShowProbabilities={setShowProbabilities}
              currentMultiplier={currentMultiplier}
              betAmount={betAmount}
              revealedCount={revealedCount}
              recommendation={recommendation}
              onCellClick={revealCell}
              onCashOut={cashOut}
              getCellColor={getCellColor}
            />
          </div>

          <GameSidebar
            recommendation={recommendation}
            isPlaying={isPlaying}
            gameOver={gameOver}
            gameWon={gameWon}
            revealedCount={revealedCount}
            totalCells={TOTAL_CELLS}
            bombCount={bombCount}
            currentStreak={stats.currentStreak}
            betAmount={betAmount}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;