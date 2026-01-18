import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { MiniWaveChart } from './MiniWaveChart';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'cyan' | 'pink' | 'purple' | 'success';
}

export function StatsCard({ title, value, icon: Icon, variant = 'purple' }: StatsCardProps) {
  const colors = {
    cyan: '#00f2ff',
    pink: '#ff0080',
    purple: '#a855f7',
    success: '#22c55e'
  };

  return (
    <div className={cn(
      'glass-card rounded-[2rem] p-8 group premium-border relative overflow-hidden transition-all hover:translate-y-[-6px]',
      variant === 'pink' && 'glow-pink',
      variant === 'cyan' && 'glow-cyan',
      variant === 'purple' && 'glow-purple'
    )}>
      <div className="flex items-center justify-between mb-6">
        <div className={cn(
          "p-4 rounded-2xl bg-white/5 shadow-inner border border-white/5",
          variant === 'cyan' && 'text-cyan-400',
          variant === 'pink' && 'text-pink-400',
          variant === 'purple' && 'text-purple-400'
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
          <MiniWaveChart
            color={colors[variant]}
            width={140}
            height={50}
            intensity={0.6}
            showGrid={true}
          />
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-[12px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-2 italic">
          {title}
        </p>
        <div className="flex items-baseline gap-3">
          <h2 className="text-5xl font-black italic tracking-tighter text-white leading-none">
            {value}
          </h2>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-success uppercase tracking-widest">+12.4%</span>
            <span className="text-[8px] font-bold text-muted-foreground/40 uppercase">Growth</span>
          </div>
        </div>
      </div>

      {/* Dynamic Background Accent */}
      <div className={cn(
        "absolute -right-10 -bottom-10 w-40 h-40 blur-[80px] opacity-10 rounded-full",
        variant === 'cyan' && 'bg-cyan-500',
        variant === 'pink' && 'bg-pink-500',
        variant === 'purple' && 'bg-purple-500'
      )} />

      {/* Decorative Technical ID */}
      <div className="absolute top-4 right-8 text-[8px] font-mono font-bold text-white/5 tracking-widest uppercase pointer-events-none">
        CORE_METRIC_S{Math.floor(Math.random() * 1000)}
      </div>
    </div>
  );
}