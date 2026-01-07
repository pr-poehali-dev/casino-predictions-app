import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Cell {
  id: number;
  state: 'hidden' | 'revealed' | 'flagged' | 'bomb';
  isBomb: boolean;
  probability: number;
  neighbors: number;
}

interface GameSidebarProps {
  recommendation: Cell | null;
  isPlaying: boolean;
  gameOver: boolean;
  gameWon: boolean;
  revealedCount: number;
  totalCells: number;
  bombCount: number;
  currentStreak: number;
  betAmount: number;
}

const GRID_SIZE = 5;

const GameSidebar = ({
  recommendation,
  isPlaying,
  gameOver,
  gameWon,
  revealedCount,
  totalCells,
  bombCount,
  currentStreak,
  betAmount,
}: GameSidebarProps) => {
  return (
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
            <span className="font-semibold text-accent">{revealedCount} / {totalCells - bombCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Текущая серия</span>
            <span className="font-semibold text-accent">{currentStreak}</span>
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
            <span className="text-muted-foreground">97-99% безопасно</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-[#1A1625] to-[#0f0b14] border border-[#2a2435]"></div>
            <span className="text-muted-foreground">Скрытая ячейка</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💎</span>
            <span className="text-muted-foreground">Безопасная ячейка</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Bomb" size={16} className="text-red-500" />
            <span className="text-muted-foreground">Бомба (проигрыш)</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GameSidebar;