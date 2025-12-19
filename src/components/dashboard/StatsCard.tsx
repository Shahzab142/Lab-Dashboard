import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'offline';
}

export function StatsCard({ title, value, icon: Icon, variant = 'default' }: StatsCardProps) {
  return (
    <div className={cn(
      'glass-card rounded-xl p-6 transition-all hover:scale-[1.02]',
      variant === 'success' && 'glow-success',
      variant === 'offline' && 'glow-offline'
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2 font-mono">{value}</p>
        </div>
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          variant === 'default' && 'bg-secondary',
          variant === 'success' && 'bg-success/20',
          variant === 'warning' && 'bg-warning/20',
          variant === 'offline' && 'bg-offline/20'
        )}>
          <Icon className={cn(
            'w-6 h-6',
            variant === 'default' && 'text-foreground',
            variant === 'success' && 'text-success',
            variant === 'warning' && 'text-warning',
            variant === 'offline' && 'text-offline'
          )} />
        </div>
      </div>
    </div>
  );
}
