import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

const BOMB_OPTIONS = [2, 3, 5, 7];

interface GameSettingsProps {
  betAmount: number;
  setBetAmount: (amount: number) => void;
  bombCount: number;
  setBombCount: (count: number) => void;
  onStartGame: () => void;
}

const GameSettings = ({ betAmount, setBetAmount, bombCount, setBombCount, onStartGame }: GameSettingsProps) => {
  return (
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
            min={2}
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
          onClick={onStartGame}
          className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90 text-background font-semibold text-lg py-6 gold-glow-strong"
        >
          <Icon name="Play" size={20} className="mr-2" />
          Начать игру
        </Button>
      </div>
    </Card>
  );
};

export default GameSettings;
