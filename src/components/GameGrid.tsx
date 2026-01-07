import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Cell {
  id: number;
  state: 'hidden' | 'revealed' | 'flagged' | 'bomb';
  isBomb: boolean;
  probability: number;
  neighbors: number;
}

interface GameGridProps {
  grid: Cell[];
  isPlaying: boolean;
  gameOver: boolean;
  gameWon: boolean;
  showProbabilities: boolean;
  setShowProbabilities: (show: boolean) => void;
  currentMultiplier: number;
  betAmount: number;
  revealedCount: number;
  recommendation: Cell | null;
  onCellClick: (index: number) => void;
  onCashOut: () => void;
  getCellColor: (cell: Cell) => string;
}

const GRID_SIZE = 5;

const GameGrid = ({
  grid,
  isPlaying,
  gameOver,
  gameWon,
  showProbabilities,
  setShowProbabilities,
  currentMultiplier,
  betAmount,
  revealedCount,
  recommendation,
  onCellClick,
  onCashOut,
  getCellColor,
}: GameGridProps) => {
  return (
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
              onClick={onCashOut}
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
            onClick={() => onCellClick(cell.id)}
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
                {cell.probability <= 5 ? (
                  <div className="flex flex-col items-center">
                    <Icon name="Bomb" size={20} className="text-red-400 mb-1" />
                    <span className="text-xs font-semibold text-red-400">
                      {cell.probability}%
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-accent">
                    {cell.probability}%
                  </span>
                )}
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
  );
};

export default GameGrid;