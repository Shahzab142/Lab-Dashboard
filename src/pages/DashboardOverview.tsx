import { Monitor, Wifi, WifiOff, Activity } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DeviceCard } from '@/components/dashboard/DeviceCard';
import { useLabPCs } from '@/hooks/useLabPCs';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export default function DashboardOverview() {
  const navigate = useNavigate();

  const { data: devices = [], isLoading: devicesLoading } = useLabPCs();
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats-overview"],
    queryFn: async () => {
      return await apiFetch("/stats/overview");
    },
    refetchInterval: 5000,
  });

  const loading = devicesLoading || statsLoading;

  // Use values from stats API if available for consistency
  const totalDevices = stats?.total_devices ?? devices.length;
  const onlineDevicesCount = stats?.online_devices ?? devices.filter(d => d.status === "online").length;
  const offlineDevicesCount = stats?.offline_devices ?? devices.filter(d => d.status === "offline").length;
  const sessionsTodayCount = stats?.sessions_today ?? 0;

  // For the grid, we only show devices that the main query returned as 'online'
  const onlineDevices = devices.filter(d => d.status === "online");

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm md:text-base">Real-time IT infrastructure overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
        {loading && !stats ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 md:h-32 rounded-xl" />
            ))}
          </>
        ) : (
          <>
            <div onClick={() => navigate('/dashboard/devices/all')} className="cursor-pointer">
              <StatsCard title="Total Devices" value={totalDevices} icon={Monitor} />
            </div>
            <div onClick={() => navigate('/dashboard/devices/online')} className="cursor-pointer">
              <StatsCard title="Online Now" value={onlineDevicesCount} icon={Wifi} variant="success" />
            </div>
            <div onClick={() => navigate('/dashboard/devices/offline')} className="cursor-pointer">
              <StatsCard title="Offline" value={offlineDevicesCount} icon={WifiOff} variant="offline" />
            </div>
            <StatsCard title="Sessions Today" value={sessionsTodayCount} icon={Activity} variant="warning" />
          </>
        )}
      </div>

      {/* Devices Grid - Only Online */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Live Devices</h2>
      </div>

      {loading && devices.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 md:h-48 rounded-xl" />
          ))}
        </div>
      ) : onlineDevices.length === 0 ? (
        <div className="glass-card rounded-xl p-8 md:p-12 text-center">
          <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No devices online</h3>
          <p className="text-muted-foreground">Online devices will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {onlineDevices.map(device => (
            <DeviceCard
              key={device.id}
              device={device}
              sessionStartTime={device.current_session?.start_time}
              disks={device.disks || []}
            />
          ))}
        </div>
      )}
    </div>
  );
}