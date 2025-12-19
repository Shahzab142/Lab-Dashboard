import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Tables } from '@/integrations/supabase/types';
import { DeviceWithMetrics } from '@/hooks/useLabPCs';
import { useEffect, useState } from 'react';

interface DeviceCardProps {
  device: DeviceWithMetrics;
  sessionStartTime?: string | null;
}

function formatDuration(startTime: string) {
  const start = new Date(startTime);
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / 1000);

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function DeviceCard({ device, sessionStartTime }: DeviceCardProps) {
  const [duration, setDuration] = useState<string>('');
  const isOnline = device.is_online_local;
  const ramPercentage = device.ram_total > 0 ? (device.ram_used / device.ram_total) * 100 : 0;
  const storagePercentage = device.storage_total > 0 ? (device.storage_used / device.storage_total) * 100 : 0;

  useEffect(() => {
    if (isOnline && sessionStartTime) {
      setDuration(formatDuration(sessionStartTime));
      const interval = setInterval(() => {
        setDuration(formatDuration(sessionStartTime));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [isOnline, sessionStartTime]);

  return (
    <div className={cn(
      'glass-card rounded-xl p-5 transition-all hover:scale-[1.01]',
      isOnline ? 'glow-success' : ''
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-3 h-3 rounded-full',
            isOnline ? 'bg-success animate-pulse-online' : 'bg-muted-foreground'
          )} />
          <div>
            <h3 className="font-semibold text-foreground">{device.hostname}</h3>
            <p className="text-xs text-muted-foreground font-mono">{device.mac_address}</p>
          </div>
        </div>
        <span className={cn(
          'text-xs font-medium px-2 py-1 rounded-full',
          isOnline ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
        )}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {isOnline && duration && (
        <div className="mb-4 text-sm text-muted-foreground">
          Online for: <span className="text-success font-mono font-medium">{duration}</span>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">System Score</span>
            <span className="font-mono text-primary font-bold">{(device as any).cpu_score || 0}</span>
          </div>
          <Progress value={Math.min(((device as any).cpu_score || 0) % 100, 100)} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">RAM</span>
            <span className="font-mono">{device.ram_used}GB / {device.ram_total}GB</span>
          </div>
          <Progress value={ramPercentage} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Storage</span>
            <span className="font-mono">{device.storage_used}GB / {device.storage_total}GB</span>
          </div>
          <Progress value={storagePercentage} className="h-2" />
        </div>
      </div>
    </div>
  );
}
