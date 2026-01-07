import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
}

const GRID_SIZE = 5;
const BOMB_COUNT = 5;

const Index = () => {
  const [grid, setGrid] = useState<Cell[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [stats, setStats] = useState<GameStats>({
    gamesPlayed: 0,
    wins: 0,
    currentStreak: 0,
    bestStreak: 0,
  });
  const [showProbabilities, setShowProbabilities] = useState(true);
  const [revealedCount, setRevealedCount] = useState(0);

  const initializeGrid = () => {
    const newGrid: Cell[] = [];
    const bombPositions = new Set<number>();

    while (bombPositions.size < BOMB_COUNT) {
      bombPositions.add(Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE)));
    }

    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
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
    calculateProbabilities(newGrid);
  };

  useEffect(() => {
    initializeGrid();
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
    
    newGrid.forEach((cell, idx) => {
      if (cell.state === 'hidden' && !cell.isBomb) {
        const neighbors = getNeighbors(idx);
        const hiddenNeighbors = neighbors.filter(
          n => newGrid[n].state === 'hidden'
        ).length;
        const revealedNeighbors = neighbors.filter(
          n => newGrid[n].state === 'revealed'
        );
        
        let bombProximity = 0;
        revealedNeighbors.forEach(n => {
          bombProximity += newGrid[n].neighbors;
        });

        const safeProbability = hiddenNeighbors > 0
          ? Math.max(10, Math.min(95, 100 - (bombProximity / hiddenNeighbors) * 30))
          : 50;

        cell.probability = Math.round(safeProbability);
      } else if (cell.state === 'revealed') {
        cell.probability = 100;
      }
    });

    setGrid(newGrid);
  };

  const revealCell = (index: number) => {
    if (gameOver || gameWon || grid[index].state !== 'hidden') return;

    const newGrid = [...grid];
    const cell = newGrid[index];

    if (cell.isBomb) {
      cell.state = 'revealed';
      setGrid(newGrid);
      setGameOver(true);
      
      setStats(prev => ({
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        currentStreak: 0,
      }));
      
      toast.error('Бомба! Игра окончена', {
        description: `Открыто ячеек: ${revealedCount}`,
      });
      return;
    }

    cell.state = 'revealed';
    const newRevealedCount = revealedCount + 1;
    setRevealedCount(newRevealedCount);

    const safeCount = GRID_SIZE * GRID_SIZE - BOMB_COUNT;
    if (newRevealedCount === safeCount) {
      setGameWon(true);
      const newStreak = stats.currentStreak + 1;
      setStats(prev => ({
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        wins: prev.wins + 1,
        currentStreak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
      }));
      toast.success('Победа! Все безопасные ячейки открыты!', {
        description: `Серия побед: ${newStreak}`,
      });
    }

    setGrid(newGrid);
    calculateProbabilities(newGrid);
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
    const hiddenCells = grid.filter(c => c.state === 'hidden' && !c.isBomb);
    if (hiddenCells.length === 0) return null;
    
    const bestCell = hiddenCells.reduce((prev, current) => 
      current.probability > prev.probability ? current : prev
    );
    
    return bestCell;
  };

  const recommendation = getRecommendation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#1A1625] to-[#0A0A0F] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 text-gold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            1WIN PREDICTOR
          </h1>
          <p className="text-muted-foreground text-lg" style={{ fontFamily: 'Roboto, sans-serif' }}>
            Система умного анализа вероятностей
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
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
                  >
                    <Icon name={showProbabilities ? 'Eye' : 'EyeOff'} size={16} className="mr-2" />
                    Вероятности
                  </Button>
                  <Button
                    onClick={initializeGrid}
                    className="bg-gradient-to-r from-accent to-primary hover:opacity-90 text-background font-semibold gold-glow"
                  >
                    <Icon name="RefreshCw" size={16} className="mr-2" />
                    Новая игра
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3 mb-4">
                {grid.map((cell) => (
                  <button
                    key={cell.id}
                    onClick={() => revealCell(cell.id)}
                    disabled={gameOver || gameWon || cell.state === 'revealed'}
                    className={`
                      aspect-square rounded-lg border-2 transition-all duration-300
                      ${getCellColor(cell)}
                      ${cell.state === 'hidden' ? 'hover:scale-105 hover:shadow-lg cursor-pointer' : ''}
                      ${recommendation?.id === cell.id && cell.state === 'hidden' ? 'ring-4 ring-accent ring-offset-2 ring-offset-background' : ''}
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
                        ) : cell.neighbors > 0 ? (
                          <span className="text-2xl font-bold text-emerald-400">{cell.neighbors}</span>
                        ) : (
                          <Icon name="Check" size={24} className="text-emerald-400" />
                        )}
                      </div>
                    )}
                    
                    {cell.state === 'hidden' && showProbabilities && !gameOver && (
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold text-accent">
                          {cell.probability}%
                        </span>
                      </div>
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
                  <Icon name="Lightbulb" size={24} className="text-accent" />
                </div>
                <h3 className="text-xl font-bold text-gold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  AI Рекомендация
                </h3>
              </div>
              
              {recommendation && !gameOver && !gameWon ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Самая безопасная ячейка:
                  </p>
                  <div className="p-4 bg-background/50 rounded-lg border border-accent/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Позиция</span>
                      <Badge variant="outline" className="border-accent text-accent">
                        {Math.floor(recommendation.id / GRID_SIZE) + 1} : {(recommendation.id % GRID_SIZE) + 1}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Вероятность</span>
                      <span className="text-2xl font-bold text-gold">{recommendation.probability}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Ячейка подсвечена золотой рамкой на поле
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {gameOver || gameWon ? 'Начните новую игру' : 'Откройте первую ячейку'}
                </p>
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
                  <span className="font-semibold text-accent">{revealedCount} / {GRID_SIZE * GRID_SIZE - BOMB_COUNT}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Текущая серия</span>
                  <span className="font-semibold text-accent">{stats.currentStreak}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Бомб на поле</span>
                  <span className="font-semibold text-destructive">{BOMB_COUNT}</span>
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
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
