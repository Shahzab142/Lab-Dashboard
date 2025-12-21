import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DeviceCardProps {
  device: any; // Using any to handle transitioning schema
  sessionStartTime?: string | null;
  disks?: any[];
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

export function DeviceCard({ device, sessionStartTime, disks = [] }: DeviceCardProps) {
  const navigate = useNavigate();
  const [duration, setDuration] = useState<string>('');
  const isOnline = device.status === 'online';

  // Support both old (total_gb) and new (total) field names
  const totalStorageFromDisks = disks.reduce((sum, d) => sum + (d.total || d.total_gb || 0), 0);
  const hasDisks = disks.length > 0;
  const totalStorage = hasDisks ? totalStorageFromDisks : (device.storage_total || 0);

  useEffect(() => {
    if (isOnline && sessionStartTime) {
      setDuration(formatDuration(sessionStartTime));
      const interval = setInterval(() => {
        setDuration(formatDuration(sessionStartTime));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [isOnline, sessionStartTime]);

  const handleClick = () => {
    navigate(`/dashboard/pc/${device.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'glass-card rounded-xl p-5 transition-all hover:scale-[1.02] cursor-pointer',
        isOnline ? 'glow-success' : ''
      )}
    >
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

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">RAM</span>
          <span className="font-mono font-medium">{device.ram_total || 0}GB</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Storage</span>
          <span className="font-mono font-medium">{totalStorage.toFixed(1)}GB</span>
        </div>
        {hasDisks && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Disks</span>
            <span className="font-mono font-medium">{disks.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}