
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import {
    BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Activity, LayoutGrid, Zap, Monitor, Loader2, Gateway, ArrowLeft, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const COLORS = [
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#6366f1", // Indigo
    "#f43f5e", // Rose
    "#06b6d4", // Cyan
    "#8b5cf6", // Violet
];

export default function TehsilPerformancePage() {
    const navigate = useNavigate();

    const { data: statsData, isLoading, isError } = useQuery({
        queryKey: ["global-lab-stats"],
        queryFn: () => apiFetch("/stats/labs/all"),
        refetchInterval: 10000,
    });

    const labs = useMemo(() => {
        const remoteLabs = statsData ? (Array.isArray(statsData) ? statsData : (Array.isArray(statsData.labs) ? statsData.labs : [])) : [];
        return remoteLabs.filter((l: any) => l && typeof l === 'object');
    }, [statsData]);

    const tehsilChartData = useMemo(() => {
        const tehsilMap = new Map<string, { online: number, total: number, labs: Set<string>, city: string, name: string }>();

        labs.forEach((l: any) => {
            const cityName = (l.city || l.district || 'ALL').trim().toUpperCase();
            let tehsilName = (l.tehsil || l.location || '').trim();

            if (!tehsilName || tehsilName.toLowerCase() === 'unknown') {
                tehsilName = cityName + " Region";
            }

            const key = `${cityName}|${tehsilName.toUpperCase()}`;

            const current = tehsilMap.get(key) || { online: 0, total: 0, labs: new Set(), city: cityName, name: tehsilName };
            current.labs.add(l.lab_name || l.lab || 'Default Lab');
            tehsilMap.set(key, {
                online: current.online + (Number(l.online) || 0),
                total: current.total + (Number(l.total_pcs || l.total) || 1),
                labs: current.labs,
                city: cityName,
                name: tehsilName
            });
        });

        return Array.from(tehsilMap.values())
            .map(stats => ({
                name: stats.name,
                value: stats.labs.size,
                onlineCount: stats.online,
                performance: Math.round((stats.online / stats.total) * 100),
                totalLabs: stats.labs.size,
                city: stats.city
            }))
            .filter(t => t.totalLabs > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 15); // Show top 15 tehsils for better visibility
    }, [labs]);

    const rankingData = useMemo(() => {
        const sorted = [...labs].sort((a, b) => (Number(a.total_pcs || a.total) || 0) - (Number(b.total_pcs || b.total) || 0)); // Reversed for vertical bar chart layout logic if needed, but horizontal usually wants highest at top. Let's keep highest at top.
        const highestAtTop = [...labs].sort((a, b) => (Number(b.total_pcs || b.total) || 0) - (Number(a.total_pcs || a.total) || 0));
        return highestAtTop.map(l => {
            const rawName = (l.lab_name || l.lab || 'Unknown').trim();
            const codePart = rawName.split('|')[0].trim();
            const displayName = codePart.length >= 6 ? codePart.substring(0, 6) : codePart;

            return {
                name: displayName.toUpperCase(),
                fullName: rawName,
                val: Number(l.total_pcs || l.total) || 0,
                city: l.city || 'Unknown'
            };
        });
    }, [labs]);

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-xs font-bold text-white/40 uppercase tracking-[0.3em]">Loading Insights...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-700 bg-background h-screen relative overflow-hidden flex flex-col no-scrollbar">
            <style dangerouslySetInnerHTML={{
                __html: `
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
            {/* Background Aesthetics */}
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

            <header className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter text-white uppercase font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Tehsil <span className="text-primary">Performance</span> Matrix
                    </h1>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em]">Regional Hub Efficiency & Asset Distribution</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="px-4 py-2 rounded-xl bg-card border border-border flex items-center gap-3 shadow-lg">
                        <Activity className="text-emerald-500 w-4 h-4" />
                        <div>
                            <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Real-time Engine</p>
                            <p className="text-xs font-black text-emerald-500 uppercase tracking-tighter">Connected</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
                {/* Tehsil Performance Chart */}
                <Card className="lg:col-span-8 bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl rounded-3xl overflow-hidden group">
                    <CardHeader className="border-b border-border/10 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <LayoutGrid size={18} />
                                </div>
                                <CardTitle className="text-lg font-bold tracking-tight uppercase text-white font-display">Regional Performance</CardTitle>
                            </div>
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Efficiency By Tehsil</span>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8 h-[380px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={tehsilChartData} margin={{ bottom: 60, top: 10 }}>
                                <CartesianGrid vertical={false} stroke="#ffffff" strokeOpacity={0.03} />
                                <XAxis
                                    dataKey="name"
                                    interval={0}
                                    tick={{ fill: '#ffffff', fontSize: 8, fontWeight: '700', opacity: 0.6 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#ffffff', fontSize: 10, fontWeight: 'bold', opacity: 0.3 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-card/95 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
                                                    <div className="flex items-center gap-3 mb-3 pb-2 border-b border-white/5">
                                                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_#3b82f6]" />
                                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{data.city}</span>
                                                    </div>
                                                    <p className="text-xl font-black text-white mb-4 uppercase tracking-tighter">{data.name}</p>
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div>
                                                            <p className="text-[8px] font-bold text-white/30 uppercase mb-1">Total Labs</p>
                                                            <p className="text-2xl font-black text-white">{data.totalLabs}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] font-bold text-white/30 uppercase mb-1">Live Status</p>
                                                            <p className="text-2xl font-black text-emerald-400">{data.performance}%</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="value"
                                    radius={[8, 8, 4, 4]}
                                    barSize={24}
                                    className="cursor-pointer"
                                    onClick={(state) => {
                                        if (state && state.name) {
                                            navigate(`/dashboard/labs?city=${state.city}&tehsil=${state.name}`);
                                        }
                                    }}
                                >
                                    {tehsilChartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            fillOpacity={0.8}
                                            className="transition-all duration-500 hover:fill-opacity-100 hover:filter hover:drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Lab Asset Distribution Chart */}
                <Card className="lg:col-span-4 bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl rounded-3xl overflow-hidden group flex flex-col">
                    <CardHeader className="border-b border-border/10 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                                <Monitor size={18} />
                            </div>
                            <CardTitle className="text-lg font-bold tracking-tight uppercase text-white font-display">Inventory Ranking</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 flex-1 max-h-[420px] flex flex-col">
                        {/* Legend-like Header for Sidebar Chart */}
                        <div className="flex justify-between px-2 text-[8px] font-black text-primary/60 mb-2 uppercase tracking-tighter shrink-0">
                            <span>LAB ID (6-DIGIT)</span>
                            <span>TOTAL PC ASSETS</span>
                        </div>
                        <ScrollArea className="flex-1 w-full pr-4">
                            <div style={{ height: Math.max(380, rankingData.length * 35) }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={rankingData}
                                        layout="vertical"
                                        margin={{ left: -20, right: 30, top: 10 }}
                                        onClick={(state) => {
                                            if (state && state.activePayload) {
                                                const data = state.activePayload[0].payload;
                                                navigate(`/dashboard/lab-summary/${encodeURIComponent(data.city)}/${encodeURIComponent(data.fullName)}`);
                                            }
                                        }}
                                    >
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fill: '#ffffff', fontWeight: 'bold', opacity: 0.4 }}
                                            width={90}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-card/95 backdrop-blur-2xl border border-white/10 p-3 rounded-xl shadow-2xl animate-in fade-in duration-200">
                                                            <p className="text-[7px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Resource ID</p>
                                                            <p className="text-[10px] font-black text-white mb-2 uppercase">{data.fullName}</p>
                                                            <div className="flex items-center justify-between gap-6 pt-2 border-t border-white/5">
                                                                <span className="text-[8px] font-bold text-white/40 uppercase">Inventory</span>
                                                                <span className="text-[10px] font-black text-primary">{data.val} Units</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar
                                            dataKey="val"
                                            radius={[0, 6, 6, 0]}
                                            barSize={12}
                                            className="cursor-pointer"
                                        >
                                            {rankingData.map((_entry, _index) => (
                                                <Cell
                                                    key={`rank-cell-${_index}`}
                                                    fill="url(#rankGradient)"
                                                    className="transition-all duration-300 hover:filter hover:brightness-125"
                                                />
                                            ))}
                                        </Bar>
                                        <defs>
                                            <linearGradient id="rankGradient" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Insight Footer */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-card/30 border border-border/50 backdrop-blur-md hover:bg-card/40 transition-all cursor-default">
                    <div className="flex items-center gap-3 mb-3">
                        <Zap className="text-yellow-500 w-4 h-4" />
                        <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Growth Index</h4>
                    </div>
                    <p className="text-3xl font-black text-white tracking-tighter">18.4% <span className="text-xs text-emerald-500">↑</span></p>
                    <p className="text-[9px] font-bold text-white/30 uppercase mt-1">System Audit Projection 2025</p>
                </div>

                <div className="p-6 rounded-3xl bg-card/30 border border-border/50 backdrop-blur-md hover:bg-card/40 transition-all cursor-default text-center">
                    <p className="text-[6px] font-bold tracking-[1.5em] text-white/10 uppercase mb-4 grayscale">Intelligence Active • Global Matrix</p>
                    <div className="flex justify-center gap-4">
                        <div className="w-1 h-8 rounded-full bg-primary/20" />
                        <div className="w-1 h-12 rounded-full bg-primary/40" />
                        <div className="w-1 h-8 rounded-full bg-primary/20" />
                    </div>
                </div>

                <div className="p-6 rounded-3xl bg-card/30 border border-border/50 backdrop-blur-md hover:bg-card/40 transition-all cursor-default">
                    <div className="flex items-center gap-3 mb-3 justify-end text-right">
                        <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Active Nodes</h4>
                        <Activity className="text-primary w-4 h-4" />
                    </div>
                    <p className="text-3xl font-black text-white tracking-tighter text-right">{labs.length}</p>
                    <p className="text-[9px] font-bold text-white/30 uppercase mt-1 text-right">Distributed Infrastructure</p>
                </div>
            </div>
        </div>
    );
}

