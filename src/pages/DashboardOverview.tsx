import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Monitor, Wifi, WifiOff, Globe, LayoutGrid, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { StatsCard } from '@/components/dashboard/StatsCard';

export default function DashboardOverview() {
  const navigate = useNavigate();

  // Fetch location stats for city-level data
  const { data: locations = [], isLoading: locLoading } = useQuery({
    queryKey: ['location-stats'],
    queryFn: () => apiFetch('/stats/locations'),
    refetchInterval: 10000
  });

  // Fetch overall stats for the cards
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats-overview'],
    queryFn: () => apiFetch('/stats/overview'),
    refetchInterval: 10000
  });

  const loading = locLoading || statsLoading;

  // Filter cities that have at least one online PC
  const onlineTerminals = locations.filter((loc: any) => loc.online > 0);

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

      {/* Top 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)
        ) : (
          <>
            <div onClick={() => navigate('/dashboard/cities')} className="cursor-pointer transition-transform hover:scale-[1.02]">
              <StatsCard title="Total Cities" value={locations.length} icon={Globe} variant="default" />
            </div>
            <div onClick={() => navigate('/dashboard/devices?status=online')} className="cursor-pointer transition-transform hover:scale-[1.02]">
              <StatsCard title="Online PCs" value={stats?.online_devices || 0} icon={Wifi} variant="success" />
            </div>
            <div onClick={() => navigate('/dashboard/devices?status=offline')} className="cursor-pointer transition-transform hover:scale-[1.02]">
              <StatsCard title="Offline PCs" value={stats?.offline_devices || 0} icon={WifiOff} variant="offline" />
            </div>
          </>
        )}
      </div>

      {/* Online Terminals Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 text-primary">
            <LayoutGrid size={20} />
          </div>
          <h2 className="text-xl font-bold italic tracking-tighter uppercase text-white">Online Terminals</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}
          </div>
        ) : onlineTerminals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {onlineTerminals.map((loc: any) => (
              <Card
                key={loc.city}
                onClick={() => navigate(`/dashboard/devices?city=${loc.city}`)}
                className="group relative overflow-hidden bg-black/40 border-white/5 backdrop-blur-3xl cursor-pointer hover:border-primary/50 transition-all hover:scale-[1.02]"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin className="text-primary w-5 h-5" />
                      <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">{loc.city}</h3>
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0" />
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase">
                      <span className="text-muted-foreground">Total Systems</span>
                      <span className="text-white">{loc.total_pcs}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase">
                      <span className="text-success">Active Nodes</span>
                      <span className="text-success">{loc.online}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase">
                      <span className="text-red-500">Offline Nodes</span>
                      <span className="text-red-500">{loc.offline}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white/5 border-dashed border-white/10 p-12 text-center">
            <WifiOff className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No active regional terminals found.</p>
          </Card>
        )}
      </section>
    </div>
  );
}
