import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, HardDrive, MemoryStick, Wifi, WifiOff, Cpu, Clock } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, parseUTC, formatUptime, formatRelativeTime, formatDetailedDuration } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';

export default function PCDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading: loading } = useQuery({
    queryKey: ["device", id],
    queryFn: async () => {
      const resp = await apiFetch(`/devices/${id}`);
      if (!resp || !resp.device) return null;

      return {
        ...resp.device,
        current_session: resp.sessions?.find((s: any) => !s.end_time),
        sessions: resp.sessions || [],
        disks: resp.disks || [],
        heartbeats: resp.heartbeats || [],
        server_time: resp.server_time
      };
    },
    enabled: !!id,
    refetchInterval: 5000,
  });

  const device = data;

  const disks = device?.disks || [];
  const pcSessions = (device?.sessions || []).sort((a: any, b: any) =>
    parseUTC(b.start_time).getTime() - parseUTC(a.start_time).getTime()
  );
  const sessionStartTime = device?.current_session?.start_time;

  const isOnline = device?.status === 'online';

  // Calculate storage stats from disks
  const totalStorage = disks.length > 0
    ? disks.reduce((sum: number, d: any) => sum + (d.total || 0), 0)
    : (device?.storage_total || 0);
  const usedStorage = disks.length > 0
    ? disks.reduce((sum: number, d: any) => sum + (d.used || 0), 0)
    : (device?.storage_used || 0);
  const storagePercentage = totalStorage > 0 ? (usedStorage / totalStorage) * 100 : 0;

  const ramTotal = device?.ram_total || 0;
  const ramUsed = device?.ram_used || 0;
  const ramPercent = ramTotal > 0 ? ((ramUsed / ramTotal) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="p-4 md:p-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="glass-card rounded-xl p-12 text-center">
          <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Device not found</h3>
          <p className="text-muted-foreground">This device may have been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className={cn(
            'w-4 h-4 rounded-full shrink-0',
            isOnline ? 'bg-success animate-pulse-online' : 'bg-muted-foreground'
          )} />
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{device.hostname}</h1>
            <p className="text-muted-foreground font-mono text-xs md:text-sm truncate">{device.mac_address}</p>
          </div>
        </div>
        <span className={cn(
          'text-sm font-medium px-3 py-1.5 rounded-full self-start sm:self-auto',
          isOnline ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
        )}>
          {isOnline ? <Wifi className="w-4 h-4 inline mr-1" /> : <WifiOff className="w-4 h-4 inline mr-1" />}
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Device Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* RAM & Storage Overview */}
        <div className="glass-card rounded-xl p-4 md:p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <MemoryStick className="w-5 h-5" />
            System Resources
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Total RAM</span>
                <span className="font-mono">{ramTotal}GB</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Used RAM</span>
                <span className="font-mono">{ramUsed.toFixed(1)}GB</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">RAM Usage</span>
                <span className="font-mono text-primary font-bold">{ramPercent}%</span>
              </div>
              <Progress value={Number(ramPercent)} className="h-2 bg-secondary" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Total Storage</span>
                <span className="font-mono">{usedStorage.toFixed(1)}GB / {totalStorage.toFixed(1)}GB</span>
              </div>
              <Progress value={storagePercentage} className="h-3" />
            </div>

            {/* System Uptime */}
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">System Uptime</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-mono text-lg text-foreground font-bold">
                  {formatUptime(device.cpu_uptime || 0)}
                </span>
              </div>
            </div>

            {sessionStartTime && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Session</span>
                  <span className="text-success font-mono font-bold">
                    {formatDetailedDuration(sessionStartTime, device.server_time)}
                  </span>
                </div>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Seen</span>
              <span className={cn("font-mono", isOnline ? "text-success" : "")}>
                {isOnline ? 'Online now' : formatRelativeTime(device.last_seen, device.server_time)}
              </span>
            </div>
          </div>
        </div>

        {/* Individual Disks */}
        <div className="glass-card rounded-xl p-4 md:p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Storage Disks ({disks.length || (device?.storage_total ? 1 : 0)})
          </h2>
          {disks.length > 0 ? (
            <div className="space-y-4">
              {disks.map((disk: any) => {
                const dTotal = disk.total || 0;
                const dUsed = disk.used || 0;
                const diskPercentage = dTotal > 0 ? (dUsed / dTotal) * 100 : 0;
                return (
                  <div key={disk.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground font-mono truncate mr-2">
                        {disk.mount || disk.disk_name}{disk.disk_label ? ` (${disk.disk_label})` : ''}
                      </span>
                      <span className="font-mono shrink-0">{dUsed.toFixed(1)}GB / {dTotal.toFixed(1)}GB</span>
                    </div>
                    <Progress
                      value={diskPercentage}
                      className={cn("h-3", diskPercentage > 90 ? "[&>div]:bg-destructive" : "")}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No disk data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Usage Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card rounded-xl p-4 md:p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">CPU Usage Over Time (%)</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={device?.heartbeats || []}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis
                  dataKey="created_at"
                  hide
                />
                <YAxis domain={[0, 100]} stroke="#666" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  labelStyle={{ color: '#999' }}
                  itemStyle={{ color: '#3b82f6' }}
                  labelFormatter={(val) => format(parseUTC(val), 'HH:mm:ss')}
                />
                <Area type="monotone" dataKey="cpu_usage" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 md:p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">RAM Usage Over Time (%)</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={device?.heartbeats || []}>
                <defs>
                  <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis
                  dataKey="created_at"
                  hide
                />
                <YAxis domain={[0, 100]} stroke="#666" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  labelStyle={{ color: '#999' }}
                  itemStyle={{ color: '#10b981' }}
                  labelFormatter={(val) => format(parseUTC(val), 'HH:mm:ss')}
                />
                <Area type="monotone" dataKey="ram_usage_pct" stroke="#10b981" fillOpacity={1} fill="url(#colorRam)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Session History */}
      <div className="glass-card rounded-xl p-4 md:p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Session History</h2>
        {pcSessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Monitor className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No session history for this device</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="whitespace-nowrap">Start Time</TableHead>
                  <TableHead className="whitespace-nowrap">End Time</TableHead>
                  <TableHead className="whitespace-nowrap">Duration</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pcSessions.map((session: any) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-mono text-sm whitespace-nowrap">
                      {format(parseUTC(session.start_time), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="font-mono text-sm whitespace-nowrap">
                      {session.end_time
                        ? format(parseUTC(session.end_time), 'MMM dd, yyyy HH:mm')
                        : '—'
                      }
                    </TableCell>
                    <TableCell className="font-mono text-sm whitespace-nowrap">
                      {(session.duration_seconds || 0)
                        ? formatUptime(session.duration_seconds)
                        : '—'
                      }
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        'text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap',
                        session.end_time
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-success/20 text-success'
                      )}>
                        {session.end_time ? 'Completed' : 'Active'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}