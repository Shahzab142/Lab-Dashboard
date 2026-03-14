import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import {
    Loader2, BarChart2, PieChart as PieIcon, Zap, Globe, ArrowLeft, Maximize2
} from "lucide-react";
import {
    ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Dashboard4() {
    const navigate = useNavigate();
    const [viewLevel, setViewLevel] = useState<'districts' | 'tehsils' | 'labs'>('districts');
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [selectedTehsil, setSelectedTehsil] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'pcs' | 'labs'>('pcs');

    const { data, isLoading } = useQuery({
        queryKey: ["global-lab-stats-d4"],
        queryFn: () => apiFetch("/stats/labs/all"),
        refetchInterval: 10000,
    });

    const labs = Array.isArray(data?.labs) ? data.labs : [];

    // Data Processing Logic (Districts -> Tehsils -> Labs)
    const districtMap = new Map();
    labs.forEach((l: any) => {
        const cityKey = l.norm_city || 'UNKNOWN';
        const cityName = l.city || (l.norm_city ? l.norm_city.charAt(0) + l.norm_city.slice(1).toLowerCase() : 'Unknown');

        if (!districtMap.has(cityKey)) {
            districtMap.set(cityKey, {
                name: cityName,
                normName: cityKey,
                labs: 0,
                pcs: 0,
                tehsils: new Map()
            });
        }
        const d = districtMap.get(cityKey);
        d.labs += 1;
        d.pcs += Number(l.total_pcs || 0);

        const tehsilKey = l.norm_tehsil || 'UNKNOWN';
        const tehsilName = l.tehsil || (l.norm_tehsil ? l.norm_tehsil.charAt(0) + l.norm_tehsil.slice(1).toLowerCase() : 'Unknown');

        if (!d.tehsils.has(tehsilKey)) {
            d.tehsils.set(tehsilKey, {
                name: tehsilName,
                labs: 0,
                pcs: 0
            });
        }
        const t = d.tehsils.get(tehsilKey);
        t.labs += 1;
        t.pcs += Number(l.total_pcs || 0);
    });

    const districtsData = Array.from(districtMap.values())
        .map((d: any) => ({
            ...d,
            tehsilCount: d.tehsils.size,
            labCount: d.labs
        }))
        .sort((a: any, b: any) => b[sortBy] - a[sortBy]);

    let chartData: any[] = districtsData;
    if (viewLevel === 'tehsils' && selectedDistrict) {
        const d = Array.from(districtMap.values()).find(dist => dist.name === selectedDistrict || dist.normName === selectedDistrict);
        if (d) {
            chartData = Array.from(d.tehsils.values()).sort((a: any, b: any) => b[sortBy] - a[sortBy]);
        }
    } else if (viewLevel === 'labs' && selectedDistrict && selectedTehsil) {
        const d = Array.from(districtMap.values()).find(dist => dist.name === selectedDistrict || dist.normName === selectedDistrict);
        if (d) {
            chartData = labs
                .filter((l: any) => (l.city === selectedDistrict || l.norm_city === d.normName) && (l.tehsil === selectedTehsil || l.norm_tehsil === selectedTehsil))
                .map((l: any) => ({
                    name: l.lab_name || l.lab_id,
                    fullData: l,
                    pcs: Number(l.total_pcs || 0),
                    labs: 1
                }))
                .sort((a: any, b: any) => b.pcs - a.pcs);
        }
    }

    const handleBarClick = (data: any) => {
        if (viewLevel === 'districts') {
            setSelectedDistrict(data.name);
            setViewLevel('tehsils');
        } else if (viewLevel === 'tehsils') {
            setSelectedTehsil(data.name);
            setViewLevel('labs');
            setSortBy('pcs'); // Force systems view when looking at labs
        } else if (viewLevel === 'labs') {
            const lab = data.fullData;
            if (lab && lab.city && (lab.lab_name || lab.lab_id)) {
                navigate(`/dashboard/lab-summary/${encodeURIComponent(lab.city)}/${encodeURIComponent(lab.lab_name || lab.lab_id)}`);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen bg-[#0F0A1E] flex items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                    <Loader2 className="w-6 h-6 text-violet-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col bg-[#0F0A1E] text-slate-200 font-sans p-4 lg:p-6 overflow-hidden relative">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
            </div>

            <div className="flex-1 flex flex-col relative z-10 w-full h-full">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 shrink-0">
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            {viewLevel !== 'districts' && (
                                <button
                                    onClick={() => {
                                        if (viewLevel === 'labs') { setViewLevel('tehsils'); setSelectedTehsil(null); }
                                        else { setViewLevel('districts'); setSelectedDistrict(null); }
                                    }}
                                    className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all text-violet-400"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                            )}
                            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                                {viewLevel === 'districts' ? "DistrictWise Graph" :
                                    viewLevel === 'tehsils' ? selectedDistrict :
                                        selectedTehsil}
                            </h1>
                        </div>
                    </div>


                </header>

                {/* Main Content (Charts) */}
                <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-0">
                    {/* Visual Share Card */}
                    <div className="bg-[#120d2b] rounded-[1.5rem] p-6 border border-white/5 relative overflow-hidden group shadow-2xl flex flex-col min-h-0 transition-all hover:border-violet-500/30">

                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                                    <PieIcon className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider italic">DistrictWise Graph Overview</h3>
                                </div>
                            </div>
                            <Maximize2 className="w-4 h-4 text-slate-600 cursor-pointer hover:text-violet-400 transition-colors" />
                        </div>

                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart width={300} height={300}>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="45%"
                                        outerRadius="75%"
                                        paddingAngle={6}
                                        dataKey={sortBy}
                                        onClick={(data) => handleBarClick(data)}
                                        stroke="rgba(0,0,0,0.2)"
                                        strokeWidth={4}
                                        labelLine={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                                        label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index, name }) => {
                                            const RADIAN = Math.PI / 180;
                                            const radius = outerRadius + 22;
                                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                            const total = chartData.reduce((acc: number, curr: any) => acc + (curr[sortBy] || 0), 0);
                                            const percent = ((value / total) * 100).toFixed(0);
                                            const displayName = name.length > 15 ? name.substring(0, 13) + '...' : name;

                                            return (
                                                <g>
                                                    <text
                                                        x={x} y={y} fill="#ffffff"
                                                        textAnchor={x > cx ? 'start' : 'end'}
                                                        dominantBaseline="central"
                                                        className="text-[9px] font-black uppercase tracking-wider"
                                                    >
                                                        {displayName}
                                                    </text>
                                                    <text
                                                        x={x} y={y + 12} fill="#A78BFA"
                                                        textAnchor={x > cx ? 'start' : 'end'}
                                                        dominantBaseline="central"
                                                        className="text-[9px] font-bold italic"
                                                    >
                                                        {percent}% ({value})
                                                    </text>
                                                </g>
                                            );
                                        }}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={[
                                                    '#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6',
                                                    '#4C1D95', '#A78BFA', '#C4B5FD', '#DDD6FE'
                                                ][index % 8]}
                                                className="outline-none hover:opacity-80 transition-opacity cursor-pointer"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-[#0F0A1E]/95 border border-violet-500/40 p-5 rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl min-w-[220px] ring-1 ring-white/10">
                                                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                                                            <p className="text-[11px] font-black text-white uppercase tracking-[0.2em] italic">{data.name}</p>
                                                            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shadow-[0_0_8px_#8b5cf6]" />
                                                        </div>

                                                        <div className="flex items-center justify-between bg-violet-500/5 p-3 rounded-2xl border border-violet-500/10">
                                                            <div className="space-y-0.5">
                                                                <span className="text-[9px] font-bold text-violet-400/80 uppercase tracking-widest block">
                                                                    {viewLevel === 'districts' ? 'Total Tehsils' :
                                                                        viewLevel === 'tehsils' ? 'Total Labs' : 'Total Systems'}
                                                                </span>
                                                                <span className="text-[8px] text-slate-500 italic font-medium">Mapped in Database</span>
                                                            </div>
                                                            <span className="text-3xl font-black text-white italic tracking-tighter drop-shadow-lg">
                                                                {viewLevel === 'districts' ? data.tehsilCount :
                                                                    viewLevel === 'tehsils' ? (data.labs || data.labCount) : (data.pcs || 0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Comparative Analytics Card */}
                    <div className="bg-[#120d2b] rounded-[1.5rem] p-6 border border-white/5 relative overflow-hidden group shadow-2xl flex flex-col min-h-0 transition-all hover:border-violet-500/30">

                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                                    <BarChart2 className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider italic">DistrictWise Graph Analysis</h3>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 overflow-x-auto custom-scrollbar-v4">
                            <div style={{ width: `${Math.max(100, chartData.length * (viewLevel === 'districts' ? 100 : 80))}px`, minWidth: '100%', height: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 20 }}>
                                        <defs>
                                            <linearGradient id="barGradient4" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#A78BFA" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#4C1D95" stopOpacity={0.8} />
                                            </linearGradient>
                                            <filter id="shadow">
                                                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#8B5CF6" floodOpacity="0.3" />
                                            </filter>
                                        </defs>
                                        <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            interval={0}
                                            tick={({ x, y, payload }) => {
                                                const name = payload.value;
                                                const truncated = name.length > 12 ? name.substring(0, 10) + '...' : name;
                                                return (
                                                    <g transform={`translate(${x},${y})`}>
                                                        <text
                                                            x={0} y={0} dy={20}
                                                            textAnchor="middle"
                                                            fill="#64748b"
                                                            className="text-[9px] font-black uppercase tracking-wider transition-colors group-hover:fill-slate-400"
                                                        >
                                                            {truncated}
                                                        </text>
                                                    </g>
                                                );
                                            }}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(139, 92, 246, 0.05)', radius: 10 }}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-[#0F0A1E]/95 border border-violet-500/40 p-5 rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl min-w-[220px] ring-1 ring-white/10">
                                                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                                                                <p className="text-[11px] font-black text-white uppercase tracking-[0.2em] italic">{label}</p>
                                                                <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shadow-[0_0_8px_#8b5cf6]" />
                                                            </div>

                                                            <div className="flex items-center justify-between bg-violet-500/5 p-3 rounded-2xl border border-violet-500/10">
                                                                <div className="space-y-0.5">
                                                                    <span className="text-[9px] font-bold text-violet-400/80 uppercase tracking-widest block">
                                                                        {viewLevel === 'districts' ? 'Total Tehsils' :
                                                                            viewLevel === 'tehsils' ? 'Total Labs' : 'Total Systems'}
                                                                    </span>
                                                                    <span className="text-[8px] text-slate-500 italic font-medium">Analytics Feed</span>
                                                                </div>
                                                                <span className="text-3xl font-black text-white italic tracking-tighter drop-shadow-lg">
                                                                    {viewLevel === 'districts' ? data.tehsilCount :
                                                                        viewLevel === 'tehsils' ? (data.labs || data.labCount) : (data.pcs || 0)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar
                                            dataKey={sortBy}
                                            fill="url(#barGradient4)"
                                            radius={[12, 12, 4, 4]}
                                            barSize={32}
                                            onClick={handleBarClick}
                                            className="cursor-pointer"
                                            style={{ filter: 'url(#shadow)' }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Micro Context Footer */}
                <footer className="mt-6 shrink-0 flex items-center justify-between px-2 opacity-30 select-none">
                    <div className="flex items-center gap-4">
                        <span className="text-[8px] font-black uppercase tracking-[0.4em]">Real-time Telemetry Active</span>
                        <div className="flex gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            <div className="w-1 h-1 rounded-full bg-violet-500" />
                        </div>
                    </div>
                    <p className="text-[8px] font-black uppercase tracking-[0.4em]">Proprietary Data Model | Monitoring Corp.</p>
                </footer>

                <style dangerouslySetInnerHTML={{
                    __html: `
          .custom-scrollbar-v4::-webkit-scrollbar { height: 6px; }
          .custom-scrollbar-v4::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.01); border-radius: 20px; }
          .custom-scrollbar-v4::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.1); border-radius: 20px; }
          .custom-scrollbar-v4::-webkit-scrollbar-thumb:hover { background: rgba(139, 92, 246, 0.2); }
        `}} />
            </div>
        </div>
    );
}
