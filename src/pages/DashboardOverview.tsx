import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, Wifi, WifiOff, LayoutGrid, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { MiniWaveChart } from '@/components/dashboard/MiniWaveChart';

export default function DashboardOverview() {
  const navigate = useNavigate();

  const { data: locResponse, isLoading: locLoading } = useQuery({
    queryKey: ['location-stats'],
    queryFn: () => apiFetch('/stats/locations'),
    refetchInterval: 10000,
    staleTime: 5000,
    gcTime: 30000,
  });

  const locations = locResponse?.locations || [];

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats-overview'],
    queryFn: () => apiFetch('/stats/overview'),
    refetchInterval: 10000,
    staleTime: 5000,
    gcTime: 30000,
  });

  const loading = locLoading || statsLoading;

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <header className="pb-6 border-b border-white/5">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">
          COMMAND <span className="text-primary">CENTER</span>
        </h1>
        <p className="text-muted-foreground font-medium mt-1 uppercase tracking-widest text-[10px]">
          Operational Overview & System Health
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)
        ) : (
          <>
            <div onClick={() => navigate('/dashboard/cities')} className="cursor-pointer">
              <StatsCard title="Total Cities" value={locations.length} icon={Globe} variant="purple" />
            </div>
            <div onClick={() => navigate('/dashboard/devices?status=online')} className="cursor-pointer">
              <StatsCard title="Online PCs" value={stats?.online_devices || 0} icon={Wifi} variant="cyan" />
            </div>
            <div onClick={() => navigate('/dashboard/devices?status=offline')} className="cursor-pointer">
              <StatsCard title="Offline PCs" value={stats?.offline_devices || 0} icon={WifiOff} variant="pink" />
            </div>
          </>
        )}
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 text-primary glow-pink">
              <LayoutGrid size={20} />
            </div>
            <h2 className="text-xl font-black italic tracking-tighter uppercase text-white">System Nodes</h2>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-white/5 py-1 px-3 rounded-full border border-white/10">
            {locations.length} Regions Active
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-[2.5rem]" />)}
          </div>
        ) : (locations && locations.length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {locations.map((loc: any) => {
              if (!loc) return null;
              const online = loc.online || 0;
              const total = loc.total_pcs || 0;
              const intensity = Math.max(0.1, (total > 0 ? (online / total) : 0));

              return (
                <Card
                  key={loc.city}
                  onClick={() => navigate(`/dashboard/devices?city=${loc.city}`)}
                  className="group relative overflow-hidden glass-card cursor-pointer hover:border-primary/50 transition-all hover:translate-y-[-4px] premium-border rounded-[2rem] min-h-[220px]"
                >
                  <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-xl font-black italic tracking-tighter uppercase text-white group-hover:text-primary transition-colors truncate pr-2">
                        {loc.city}
                      </h3>
                      <MoreVertical size={16} className="text-muted-foreground/30" />
                    </div>

                    <div className="flex justify-center flex-1 items-center">
                      <MiniWaveChart
                        color="#ff0080"
                        width={180}
                        height={50}
                        intensity={intensity}
                        showGrid={true}
                      />
                    </div>

                    <div className="flex items-end justify-between border-t border-white/5 pt-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black italic text-white tracking-tighter">{total}</span>
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Total</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black italic text-[#00ff9d] tracking-tighter text-glow-cyan">{online}</span>
                        <span className="text-[8px] font-black text-[#00ff9d]/40 uppercase tracking-widest">Live</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-white/5 border-dashed border-white/10 p-12 text-center">
            <WifiOff className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No active nodes detected.</p>
          </Card>
        )}
      </section>
    </div>
  );
}
