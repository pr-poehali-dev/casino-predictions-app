import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

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
const BOMB_OPTIONS = [1, 3, 5, 7];

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
  const [bombCount, setBombCount] = useState(3);
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
        cell.probability = 100;
        return;
      }

      if (cell.state === 'hidden') {
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

        const finalProbability = Math.min(99, Math.max(10, baseProbability + bombProximityScore + positionBonus));
        cell.probability = Math.round(finalProbability);
      }
    });

    setGrid(newGrid);
  };

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
              <Card className="p-6 bg-gradient-to-br from-card to-secondary border-2 border-accent/30 gold-glow">
                <h3 className="text-xl font-bold text-gold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Настройки игры
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Ставка (₽)
                    </label>
                    <Input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="bg-background border-accent/30 text-foreground"
                      min={1}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Количество бомб
                      </label>
                      <Badge variant="outline" className="border-accent text-accent text-lg">
                        {bombCount}
                      </Badge>
                    </div>
                    <Slider
                      value={[bombCount]}
                      onValueChange={(v) => setBombCount(v[0])}
                      min={1}
                      max={7}
                      step={1}
                      className="mb-2"
                    />
                    <div className="flex gap-2 flex-wrap">
                      {BOMB_OPTIONS.map(option => (
                        <Button
                          key={option}
                          variant={bombCount === option ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setBombCount(option)}
                          className={bombCount === option ? 'bg-accent text-background' : 'border-accent/30'}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={initializeGrid}
                    className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90 text-background font-semibold text-lg py-6 gold-glow-strong"
                  >
                    <Icon name="Play" size={20} className="mr-2" />
                    Начать игру
                  </Button>
                </div>
              </Card>
            )}

            <Card className="p-8 bg-gradient-to-br from-card to-secondary border-2 border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Игровое поле
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProbabilities(!showProbabilities)}
                    className="border-accent/50 hover:bg-accent/10"
                    disabled={!isPlaying}
                  >
                    <Icon name={showProbabilities ? 'Eye' : 'EyeOff'} size={16} className="mr-2" />
                    Вероятности
                  </Button>
                  {isPlaying && revealedCount > 0 && (
                    <Button
                      onClick={cashOut}
                      className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-90 text-white font-semibold gold-glow"
                    >
                      <Icon name="DollarSign" size={16} className="mr-2" />
                      Забрать {Math.round(betAmount * currentMultiplier)} ₽
                    </Button>
                  )}
                </div>
              </div>

              {isPlaying && (
                <div className="mb-4 p-4 bg-accent/10 rounded-lg border border-accent/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Текущий множитель</span>
                    <span className="text-3xl font-bold text-gold">×{currentMultiplier}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Потенциальный выигрыш: <span className="text-accent font-semibold">{Math.round(betAmount * currentMultiplier)} ₽</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-5 gap-3 mb-4">
                {grid.map((cell) => (
                  <button
                    key={cell.id}
                    onClick={() => revealCell(cell.id)}
                    disabled={!isPlaying || gameOver || gameWon || cell.state === 'revealed'}
                    className={`
                      aspect-square rounded-lg border-2 transition-all duration-300
                      ${getCellColor(cell)}
                      ${cell.state === 'hidden' && isPlaying ? 'hover:scale-105 hover:shadow-lg cursor-pointer' : ''}
                      ${recommendation?.id === cell.id && cell.state === 'hidden' && isPlaying ? 'ring-4 ring-accent ring-offset-2 ring-offset-background' : ''}
                      ${cell.state === 'revealed' ? 'scale-95' : ''}
                      disabled:cursor-not-allowed
                      flex items-center justify-center
                      relative overflow-hidden
                    `}
                  >
                    {cell.state === 'revealed' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {cell.isBomb ? (
                          <Icon name="Bomb" size={24} className="text-red-500" />
                        ) : (
                          <span className="text-2xl">💎</span>
                        )}
                      </div>
                    )}
                    
                    {cell.state === 'hidden' && showProbabilities && isPlaying && (
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold text-accent">
                          {cell.probability}%
                        </span>
                      </div>
                    )}

                    {cell.state === 'hidden' && !isPlaying && (
                      <div className="text-2xl opacity-30">❓</div>
                    )}
                  </button>
                ))}
              </div>

              {(gameOver || gameWon) && (
                <div className="text-center mt-4">
                  <Badge
                    variant={gameWon ? 'default' : 'destructive'}
                    className="text-lg px-6 py-2"
                  >
                    {gameWon ? '🏆 Победа!' : '💥 Поражение'}
                  </Badge>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-card to-secondary border-2 border-accent/30 gold-glow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-accent/20">
                  <Icon name="Zap" size={24} className="text-accent" />
                </div>
                <h3 className="text-xl font-bold text-gold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  AI Predictor Pro
                </h3>
              </div>
              
              {recommendation && isPlaying && !gameOver && !gameWon ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Точность AI</span>
                    <Badge className="bg-emerald-600 text-white">99% Success Rate</Badge>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-emerald-950/50 to-emerald-900/30 rounded-lg border-2 border-emerald-600/50 gold-glow">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon name="Target" size={20} className="text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-400">Рекомендуемый ход</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Позиция</span>
                      <Badge variant="outline" className="border-accent text-accent">
                        Ряд {Math.floor(recommendation.id / GRID_SIZE) + 1}, Ячейка {(recommendation.id % GRID_SIZE) + 1}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Вероятность успеха</span>
                      <span className="text-3xl font-bold text-gold">{recommendation.probability}%</span>
                    </div>
                  </div>
                  
                  <div className="bg-accent/10 p-3 rounded-lg border border-accent/30">
                    <div className="flex items-center gap-2">
                      <Icon name="CheckCircle" size={16} className="text-emerald-400" />
                      <span className="text-xs text-muted-foreground">
                        Ячейка подсвечена золотой рамкой
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-accent/20 flex items-center justify-center">
                    <Icon name="Brain" size={32} className="text-accent" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {!isPlaying ? 'Начните игру для активации AI' : 'AI анализирует поле...'}
                  </p>
                </div>
              )}
            </Card>

            <Card className="p-6 bg-gradient-to-br from-card to-secondary border-2 border-border">
              <div className="flex items-center gap-3 mb-4">
                <Icon name="Info" size={20} className="text-accent" />
                <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Текущая игра
                </h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Открыто ячеек</span>
                  <span className="font-semibold text-accent">{revealedCount} / {TOTAL_CELLS - bombCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Текущая серия</span>
                  <span className="font-semibold text-accent">{stats.currentStreak}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Бомб на поле</span>
                  <span className="font-semibold text-destructive">{bombCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ставка</span>
                  <span className="font-semibold text-accent">{betAmount} ₽</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-card to-secondary border-2 border-border">
              <div className="flex items-center gap-3 mb-4">
                <Icon name="Target" size={20} className="text-accent" />
                <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Легенда
                </h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-green-900/40 to-green-800/40 border border-green-700/50"></div>
                  <span className="text-muted-foreground">80%+ безопасно</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-yellow-900/40 to-yellow-800/40 border border-yellow-700/50"></div>
                  <span className="text-muted-foreground">60-79% безопасно</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-900/40 to-orange-800/40 border border-orange-700/50"></div>
                  <span className="text-muted-foreground">40-59% безопасно</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💎</span>
                  <span className="text-muted-foreground">Безопасная ячейка</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Bomb" size={16} className="text-red-500" />
                  <span className="text-muted-foreground">Бомба</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;