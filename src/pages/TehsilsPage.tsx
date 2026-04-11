
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Landmark, Search, MapPin, ChevronRight, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function TehsilsPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const city = searchParams.get('city');
    const [searchTerm, setSearchTerm] = useState('');

    const { data: statsData, isLoading } = useQuery({
        queryKey: ['global-lab-stats'],
        queryFn: () => apiFetch('/stats/labs/all'),
        refetchInterval: 10000,
    });

    const tehsils = useMemo(() => {
        const labs = Array.isArray(statsData?.labs) ? statsData.labs : [];
        
        // --- FALLBACK LOGIC ---
        // If city is missing, we show ALL tehsils from ALL cities instead of an empty screen.
        const filteredLabs = city 
            ? labs.filter((l: any) => l.city?.toLowerCase() === city?.toLowerCase())
            : labs;

        const tehsilMap = new Map<string, any>();
        filteredLabs.forEach((lab: any) => {
            const tehsilName = lab.tehsil || 'Unknown';
            const groupKey = city ? tehsilName : `${lab.city}-${tehsilName}`;

            if (!tehsilMap.has(groupKey)) {
                tehsilMap.set(groupKey, {
                    tehsil: tehsilName,
                    city: lab.city,
                    total_pcs: 0,
                    online: 0,
                    total_labs: 0
                });
            }
            const target = tehsilMap.get(groupKey);
            target.total_pcs += Number(lab.total_pcs || 0);
            target.online += Number(lab.online || 0);
            target.total_labs += 1;
        });

        return Array.from(tehsilMap.values());
    }, [statsData, city]);

    const filteredTehsils = tehsils.filter((t: any) =>
        t.tehsil.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const maxLabsInTehsil = useMemo(() => {
        if (!tehsils || tehsils.length === 0) return 10;
        return Math.max(...tehsils.map(t => t.total_labs || 0), 5);
    }, [tehsils]);

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-right-4 duration-700 bg-background min-h-screen">
            <header className="pb-6 border-b border-border space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 rounded-lg bg-card border border-border text-[9px] font-bold uppercase tracking-widest text-white/70 hover:text-primary hover:border-primary transition-all font-display"
                            onClick={() => navigate('/dashboard/overview')}
                        >
                            <ArrowLeft className="w-3 h-3 mr-2" /> Back to Districts
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight uppercase text-white font-display leading-tight">
                                {city ? (
                                    <>TEHSILS IN <span className="text-primary">{city}</span></>
                                ) : (
                                    <span className="text-primary">ALL TEHSILS</span>
                                )}
                            </h1>
                            <p className="text-white/40 font-bold uppercase tracking-wider text-[9px] mt-1">
                                Regional Hubs & Infrastructure Breakdown
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-2">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-all" />
                        <Input
                            placeholder="SEARCH BY TEHSIL NAME..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 bg-card border-border focus:ring-1 focus:ring-primary text-[10px] font-bold uppercase tracking-wider h-11 rounded-lg transition-all shadow-sm"
                        />
                    </div>
                </div>
            </header>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
                </div>
            ) : filteredTehsils.length === 0 ? (
                <div className="p-20 text-center bg-card border border-dashed border-border rounded-2xl shadow-sm">
                    <Landmark className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-20" />
                    <h3 className="text-xl font-bold text-primary uppercase tracking-tight">No Tehsils Found</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTehsils.map((t: any) => {
                        const gaugeData = [
                            { name: 'Labs', value: t.total_labs },
                            { name: 'Remaining', value: Math.max(0, maxLabsInTehsil - t.total_labs) }
                        ];

                        return (
                            <Card
                                key={`${t.city || city}-${t.tehsil}`}
                                onClick={() => navigate(`/dashboard/labs?city=${city}&tehsil=${t.tehsil}`)}
                                className="group relative overflow-hidden bg-card cursor-pointer border border-border hover:border-primary/40 transition-all hover:translate-y-[-4px] shadow-sm hover:shadow-lg rounded-2xl min-h-[200px] flex flex-col"
                            >
                                <CardContent className="p-5 flex flex-col justify-between flex-1 gap-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-secondary text-white shadow-sm group-hover:bg-primary group-hover:text-black transition-colors shrink-0">
                                                <Landmark size={14} />
                                            </div>
                                            <h2 className="text-sm font-bold tracking-tight uppercase text-white truncate font-display">
                                                {t.tehsil}
                                            </h2>
                                        </div>
                                        <ChevronRight size={14} className="text-white/20 group-hover:text-primary transition-colors shrink-0" />
                                    </div>

                                    {/* Gauge Section */}
                                    <div className="flex-1 flex flex-col items-center justify-end relative h-24 mt-2">
                                        <div className="h-24 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart width={100} height={100}>
                                                    <defs>
                                                        <linearGradient id="gaugeGradientTehsil" x1="0" y1="0" x2="1" y2="0">
                                                            <stop offset="0%" stopColor="#f99a1d" stopOpacity={0.6} />
                                                            <stop offset="100%" stopColor="#f99a1d" stopOpacity={1} />
                                                        </linearGradient>
                                                    </defs>
                                                    <Pie
                                                        data={gaugeData}
                                                        cx="50%"
                                                        cy="100%"
                                                        startAngle={180}
                                                        endAngle={0}
                                                        innerRadius={45}
                                                        outerRadius={60}
                                                        paddingAngle={0}
                                                        dataKey="value"
                                                        stroke="none"
                                                    >
                                                        <Cell fill="url(#gaugeGradientTehsil)" className="drop-shadow-[0_0_8px_rgba(249,154,29,0.3)]" />
                                                        <Cell fill="rgba(255, 255, 255, 0.03)" />
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                                            <div className="text-2xl font-black text-white leading-none">
                                                {t.total_labs}
                                            </div>
                                            <div className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] mt-0.5">
                                                TOTAL LABS
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end border-t border-white/5 pt-3 mt-1">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-400/5 border border-emerald-400/10 group-hover:bg-emerald-400/10 transition-all">
                                            <div className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]" />
                                            <span className="text-lg font-bold text-emerald-400 tracking-tight leading-none">{t.online}</span>
                                            <span className="text-[8px] font-black text-emerald-400/40 uppercase tracking-widest">LIVE</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
