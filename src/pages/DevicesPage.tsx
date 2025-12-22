import { useLabPCs } from '@/hooks/useLabPCs';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { cn, formatUptime, formatRelativeTime } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function DevicesPage() {
  const navigate = useNavigate();
  const { data: devicesData, isLoading: loading } = useLabPCs();
  const devices = devicesData || [];

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
            {devices.map((device: any) => {
              const isOnline = device.status === 'online';

              const ramTotal = device.ram_total || 0;
              const ramUsed = device.ram_used || 0;
              const ramPct = ramTotal > 0 ? (ramUsed / ramTotal) * 100 : 0;

              const storageTotal = device.storage_total || 0;
              const storageUsed = device.storage_used || 0;
              const storagePct = storageTotal > 0 ? (storageUsed / storageTotal) * 100 : 0;

              const sessionStart = device.current_session?.start_time;

              return (
                <TableRow
                  key={device.id}
                  className="border-border cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => navigate(`/dashboard/pc/${device.id}`)}
                >
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
                    {isOnline && sessionStart ? (
                      <span className="text-success">{formatUptime(device.duration_seconds || 0)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="w-24">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span>{ramUsed.toFixed(1)}/{ramTotal.toFixed(1)}GB</span>
                      </div>
                      <Progress value={ramPct} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-24">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span>{storageUsed.toFixed(1)}/{storageTotal.toFixed(1)}GB</span>
                      </div>
                      <Progress value={storagePct} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatRelativeTime(device.last_seen, device.server_time)}
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
