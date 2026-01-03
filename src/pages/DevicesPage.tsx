import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { DeviceCard } from '@/components/dashboard/DeviceCard';
import { Search, Monitor, ArrowLeft, Filter, Power, PowerOff, Layout } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function DevicesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cityParam = searchParams.get('city');
  const statusParam = searchParams.get('status') as 'all' | 'online' | 'offline';

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>(statusParam || 'all');

  useEffect(() => {
    if (statusParam) setStatusFilter(statusParam);
  }, [statusParam]);

  const { data: response, isLoading } = useQuery({
    queryKey: ['devices-list', cityParam, statusFilter, search],
    queryFn: () => {
      let path = '/devices?';
      if (cityParam) path += `city=${cityParam}&`;
      if (statusFilter !== 'all') path += `status=${statusFilter}&`;
      if (search) path += `search=${search}&`;
      return apiFetch(path);
    },
    refetchInterval: 15000
  });

  const devices = response?.devices || [];

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* Network Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="rounded-full bg-white/5 hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white">
              {cityParam ? cityParam : "GLOBAL"} <span className="text-primary">TERMINAL</span>
            </h1>
            <p className="text-muted-foreground font-medium mt-1 uppercase tracking-widest text-[10px]">
              System Node Management & Inventory
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Segmented Control for Status */}
          <div className="flex p-1 rounded-xl bg-black/40 border border-white/5">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                statusFilter === 'all' ? "bg-primary text-black shadow-lg" : "text-muted-foreground hover:text-white"
              )}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('online')}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                statusFilter === 'online' ? "bg-success text-white shadow-lg shadow-success/20" : "text-muted-foreground hover:text-white"
              )}
            >
              Online
            </button>
            <button
              onClick={() => setStatusFilter('offline')}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                statusFilter === 'offline' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-muted-foreground hover:text-white"
              )}
            >
              Offline
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="SEARCH NODE / HID..."
              className="pl-10 bg-black/40 border-white/5 font-bold text-xs uppercase"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <Layout size={14} className="text-primary" />
          Displaying {devices.length} Nodes {cityParam ? `in ${cityParam.toUpperCase()}` : "Globally"}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : devices.length === 0 ? (
        <Card className="bg-black/40 border-dashed border-white/10 p-20 text-center">
          <Monitor className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
          <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">No Active Nodes Found</h3>
          <p className="text-muted-foreground text-sm uppercase font-bold tracking-widest mt-2 px-8">
            The requested filters returned zero results. Adjust your parameters or check agent status.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {devices.map((device: any) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      )}
    </div>
  );
}
