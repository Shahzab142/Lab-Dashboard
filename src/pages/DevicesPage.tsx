import { useLabPCs } from '@/hooks/useLabPCs';
import { usePCSessions } from '@/hooks/usePCSessions';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function DevicesPage() {
  const { devices, loading: devicesLoading } = useLabPCs();
  const { activeSessions, loading: sessionsLoading } = usePCSessions();

  const loading = devicesLoading || sessionsLoading;

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Devices</h1>
        <p className="text-muted-foreground">Detailed view of all lab PCs</p>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Hostname</TableHead>
              <TableHead className="text-muted-foreground">MAC Address</TableHead>
              <TableHead className="text-muted-foreground">Uptime</TableHead>
              <TableHead className="text-muted-foreground">RAM</TableHead>
              <TableHead className="text-muted-foreground">Storage</TableHead>
              <TableHead className="text-muted-foreground">Last Seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map(device => {
              const isOnline = device.status === 'online';
              const sessionStartTime = activeSessions.get(device.id);
              const ramPct = device.ram_total > 0 ? (device.ram_used / device.ram_total) * 100 : 0;
              const storagePct = device.storage_total > 0 ? (device.storage_used / device.storage_total) * 100 : 0;

              return (
                <TableRow key={device.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        isOnline ? 'bg-success animate-pulse-online' : 'bg-muted-foreground'
                      )} />
                      <span className={cn(
                        'text-xs font-medium',
                        isOnline ? 'text-success' : 'text-muted-foreground'
                      )}>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{device.hostname}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{device.mac_address}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {isOnline && sessionStartTime ? (
                      <span className="text-success">{formatDistanceToNow(new Date(sessionStartTime))}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="w-24">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{device.ram_used}/{device.ram_total}GB</span>
                      </div>
                      <Progress value={ramPct} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-24">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{device.storage_used}/{device.storage_total}GB</span>
                      </div>
                      <Progress value={storagePct} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {device.last_seen ? formatDistanceToNow(new Date(device.last_seen), { addSuffix: true }) : '-'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
