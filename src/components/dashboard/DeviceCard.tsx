import { cn, formatDetailedDuration } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DeviceCardProps {
  device: any; // Using any to handle transitioning schema
  sessionStartTime?: string | null;
  disks?: any[];
}


export function DeviceCard({ device, sessionStartTime, disks = [] }: DeviceCardProps) {
  const navigate = useNavigate();
  const [duration, setDuration] = useState<string>('');
  const isOnline = device.status === 'online';

  // Calculate storage stats
  const storageTotal = disks.length > 0
    ? disks.reduce((sum, d) => sum + (d.total || 0), 0)
    : (device.storage_total || 0);
  const storageUsed = disks.length > 0
    ? disks.reduce((sum, d) => sum + (d.used || 0), 0)
    : (device.storage_used || 0);

  const hasStorage = storageTotal > 0;
  const hasDisks = disks.length > 0;

  useEffect(() => {
    if (isOnline && sessionStartTime) {
      setDuration(formatDetailedDuration(sessionStartTime, device.server_time));
      const interval = setInterval(() => {
        setDuration(formatDetailedDuration(sessionStartTime, device.server_time));
      }, 10000); // 10s for better precision
      return () => clearInterval(interval);
    }
  }, [isOnline, sessionStartTime, device.server_time]);

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
          <span className="font-mono font-medium">{storageUsed.toFixed(1)}/{storageTotal.toFixed(1)}GB</span>
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