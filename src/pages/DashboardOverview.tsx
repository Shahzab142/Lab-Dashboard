import { Monitor, Wifi, WifiOff, Activity } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DeviceCard } from '@/components/dashboard/DeviceCard';
import { ServerStatus } from '@/components/dashboard/ServerStatus';
import { useLabPCs } from '@/hooks/useLabPCs';
import { usePCSessions } from '@/hooks/usePCSessions';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardOverview() {
  const { devices, loading: devicesLoading, onlineCount, offlineCount, totalCount } = useLabPCs();
  const { activeSessions, loading: sessionsLoading, todaySessionsCount } = usePCSessions();

  const loading = devicesLoading || sessionsLoading;

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Real-time IT infrastructure overview</p>
        </div>
        <ServerStatus />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </>
        ) : (
          <>
            <StatsCard title="Total Devices" value={totalCount} icon={Monitor} />
            <StatsCard title="Online Now" value={onlineCount} icon={Wifi} variant="success" />
            <StatsCard title="Offline" value={offlineCount} icon={WifiOff} variant="offline" />
            <StatsCard title="Sessions Today" value={todaySessionsCount} icon={Activity} variant="warning" />
          </>
        )}
      </div>

      {/* Devices Grid */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Live Devices</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : devices.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No devices found</h3>
          <p className="text-muted-foreground">Devices will appear here once they connect.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map(device => (
            <DeviceCard
              key={device.id}
              device={device}
              sessionStartTime={activeSessions.get(device.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
