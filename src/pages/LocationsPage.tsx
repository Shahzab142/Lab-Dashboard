import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Monitor, Wifi, WifiOff, Globe, ArrowRight, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function LocationsPage() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');

    const { data: locations = [], isLoading } = useQuery({
        queryKey: ['location-stats'],
        queryFn: () => apiFetch('/stats/locations'),
        refetchInterval: 10000
    });

    const filteredLocations = locations.filter((loc: any) => {
        if (filter === 'online') return loc.online > 0;
        if (filter === 'offline') return loc.offline > 0;
        return true;
    });

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-right-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">
                        REGIONAL <span className="text-primary">LOCATIONS</span>
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1 uppercase tracking-widest text-[10px]">
                        Geographic Distribution & Node Density
                    </p>
                </div>

                <div className="flex p-1 rounded-xl bg-black/40 border border-white/5">
                    <button
                        onClick={() => setFilter('all')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            filter === 'all' ? "bg-primary text-black" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('online')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            filter === 'online' ? "bg-success text-white" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        Online
                    </button>
                    <button
                        onClick={() => setFilter('offline')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            filter === 'offline' ? "bg-red-500 text-white" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        Offline
                    </button>
                </div>
            </header>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}
                </div>
            ) : filteredLocations.length === 0 ? (
                <Card className="bg-white/5 border-dashed border-white/10 p-20 text-center">
                    {filter === 'offline' ? (
                        <Wifi className="w-16 h-16 text-success mx-auto mb-6 opacity-30" />
                    ) : (
                        <WifiOff className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-30" />
                    )}
                    <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">
                        {filter === 'offline' ? "Perfect Network Status" : "No Locations Found"}
                    </h3>
                    <p className="text-muted-foreground text-sm uppercase font-bold tracking-widest mt-2">
                        {filter === 'offline' ? "Zero systems are currently offline in the registered regions." : "No nodes match the selected criteria."}
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredLocations.map((loc: any) => (
                        <Card
                            key={loc.city}
                            onClick={() => navigate(`/dashboard/devices?city=${loc.city}`)}
                            className="group relative overflow-hidden bg-black/40 border-white/5 backdrop-blur-3xl cursor-pointer hover:border-primary/50 transition-all hover:scale-[1.02]"
                        >
                            <CardContent className="p-8 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 rounded-2xl bg-white/5 text-primary">
                                            <MapPin size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white group-hover:text-primary transition-colors">
                                                {loc.city}
                                            </h2>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Registered Region Node</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/5">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">PC Snapshot</span>
                                        <span className="text-sm font-black text-white">{loc.total_pcs} Total</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-success/5 border border-success/10">
                                        <span className="text-[10px] font-bold text-success uppercase">Active State</span>
                                        <span className="text-sm font-black text-success">{loc.online} Online</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                                        <span className="text-[10px] font-bold text-red-500 uppercase">Downtime</span>
                                        <span className="text-sm font-black text-red-500">{loc.offline} Offline</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex justify-end">
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-primary italic opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                        OPEN NODE TERMINAL <ArrowRight size={12} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
