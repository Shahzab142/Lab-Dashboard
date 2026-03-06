import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useMemo, useState } from 'react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
    PieChart, Pie, Cell, BarChart, Bar, CartesianGrid
} from "recharts";
import { Users, Globe, Landmark, Monitor, MoreHorizontal, Filter, Share2, ArrowUpRight, Activity, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const ALL_DISTRICTS = [
    "Attock", "Bahawalnagar", "Bahawalpur", "Bhakkar", "Chakwal", "Chiniot", "Faisalabad",
    "Gujranwala", "Gujrat", "Hafizabad", "Jhang", "Jhelum", "Kasur", "Khanewal", "Khushab", "Kot Addu",
    "Lahore", "Layyah", "Lodhran", "Mandi Bahud Din", "Mianwali", "Multan", "Muzaffargarh",
    "Nankana Sahib", "Narowal", "Okara", "Pakpattan", "Rahim Yar Khan",
    "Rajanpur", "Rawalpindi", "Sahiwal", "Sargodha", "Sheikhupura", "Sialkot",
    "Toba Tek Singh", "Vehari"
];

const PIE_COLORS = ['#f99a1d', 'rgba(255,255,255,0.03)'];

const tableData = [
    { name: "Lahore Central", owner: "Ali Ahmed", date: "April 3, 2024", status: "Open", impact: "$150,000", initial: "A" },
    { name: "Faisalabad Node", owner: "Sarah Khan", date: "May 20, 2024", status: "In Progress", impact: "$210,000", initial: "B" },
    { name: "Multan Hub", owner: "John Wick", date: "July 17, 2024", status: "Closed", impact: "$450,000", initial: "R" },
    { name: "Gujrat Lab", owner: "Mike Ross", date: "August 8, 2024", status: "Open", impact: "$120,000", initial: "M" },
];

export default function Dashboard5() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'active' | 'all'>('active');
    const [donutViewMode, setDonutViewMode] = useState<'active' | 'inactive' | 'all'>('all');
    const [viewLevel, setViewLevel] = useState<'districts' | 'tehsils' | 'labs'>('districts');
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [selectedTehsil, setSelectedTehsil] = useState<string | null>(null);

    const { data: statsData } = useQuery({
        queryKey: ["global-lab-stats-d5"],
        queryFn: () => apiFetch("/stats/labs/all"),
        refetchInterval: 30000,
    });

    const labs = statsData?.labs || [];
    const totalPcs = labs.reduce((acc: number, l: any) => acc + Number(l.total_pcs || 0), 0);

    const citySet = new Set();
    const tehsilSet = new Set();
    labs.forEach((l: any) => {
        if (l.city) citySet.add(l.city);
        if (l.tehsil) tehsilSet.add(`${l.city}|${l.tehsil}`);
    });

    const chartData = useMemo(() => {
        if (viewLevel === 'districts') {
            const cityMap = new Map<string, { total: number, online: number, labs: number, tehsils: Set<string> }>();
            if (viewMode === 'all') {
                ALL_DISTRICTS.forEach(d => cityMap.set(d, { total: 0, online: 0, labs: 0, tehsils: new Set() }));
            }
            labs.forEach((l: any) => {
                const city = l.city || 'Unknown';
                const current = cityMap.get(city) || { total: 0, online: 0, labs: 0, tehsils: new Set() };
                current.total += Number(l.total_pcs || 0);
                current.online += Number(l.online || 0);
                current.labs += 1;
                if (l.tehsil) current.tehsils.add(l.tehsil);
                cityMap.set(city, current);
            });
            return Array.from(cityMap.entries())
                .map(([name, stats]) => ({
                    name,
                    value: stats.total,
                    online: stats.online,
                    labCount: stats.labs,
                    tehsilCount: stats.tehsils.size
                }))
                .filter(d => viewMode === 'all' || d.online > 0)
                .sort((a, b) => b.value - a.value);
        }

        if (viewLevel === 'tehsils') {
            const tehsilMap = new Map<string, { total: number, online: number, labs: number }>();
            labs.filter((l: any) => !selectedDistrict || l.city === selectedDistrict).forEach((l: any) => {
                const tName = l.tehsil || 'Unknown';
                const current = tehsilMap.get(tName) || { total: 0, online: 0, labs: 0 };
                current.total += Number(l.total_pcs || 0);
                current.online += Number(l.online || 0);
                current.labs += 1;
                tehsilMap.set(tName, current);
            });
            return Array.from(tehsilMap.entries())
                .map(([name, stats]) => ({
                    name,
                    value: stats.total,
                    online: stats.online,
                    labCount: stats.labs
                }))
                .filter(d => viewMode === 'all' || d.online > 0)
                .sort((a, b) => b.value - a.value);
        }

        // Labs Level
        return labs
            .filter((l: any) => (!selectedDistrict || l.city === selectedDistrict) && (!selectedTehsil || l.tehsil === selectedTehsil))
            .map((l: any) => ({
                name: l.lab_name || "Unknown Lab",
                value: Number(l.total_pcs || 0),
                online: Number(l.online || 0),
                fullData: l
            }))
            .filter((d: any) => viewMode === 'all' || d.online > 0)
            .sort((a: any, b: any) => b.value - a.value);
    }, [labs, viewMode, viewLevel, selectedDistrict, selectedTehsil]);

    const handleDrillDown = (item: any) => {
        if (!item) return;
        if (viewLevel === 'districts') {
            setSelectedDistrict(item.name);
            setViewLevel('tehsils');
        } else if (viewLevel === 'tehsils') {
            setSelectedTehsil(item.name);
            setViewLevel('labs');
        } else {
            const lab = item.fullData;
            if (lab && lab.city && lab.lab_name) {
                navigate(`/dashboard/lab-summary/${encodeURIComponent(lab.city)}/${encodeURIComponent(lab.lab_name)}`);
            }
        }
    };

    const resetToGlobal = () => {
        setViewLevel('districts');
        setSelectedDistrict(null);
        setSelectedTehsil(null);
        setViewMode('all');
    };

    const { data: allPcsData } = useQuery({
        queryKey: ["top-pcs-utilization-d5"],
        queryFn: async () => {
            const { data, error } = await supabase.from('devices').select('*');
            if (error) throw error;
            return data;
        },
        refetchInterval: 5000,
    });

    const topPcs = useMemo(() => {
        if (!allPcsData) return [];
        let data = [...allPcsData]
            .sort((a, b) => (Number(b.cpu_score) || 0) - (Number(a.cpu_score) || 0))
            .slice(0, 4)
            .map(pc => ({
                name: pc.pc_name || "STATION",
                district: pc.city || "Unknown",
                status: pc.status || "online",
                cpu: Number(pc.cpu_score) || 0,
                value: Number(pc.cpu_score) || 0,
                id: pc.system_id,
                initial: (pc.pc_name || "S").charAt(0).toUpperCase()
            }));

        const placeholders = [
            { name: "BACKUP-STATION-01", district: "Lahore", status: "offline", cpu: 0, value: 0, id: "mock-1", initial: "B" },
            { name: "BACKUP-STATION-02", district: "Karachi", status: "offline", cpu: 0, value: 0, id: "mock-2", initial: "B" },
            { name: "BACKUP-STATION-03", district: "Multan", status: "offline", cpu: 0, value: 0, id: "mock-3", initial: "B" },
            { name: "BACKUP-STATION-04", district: "Peshawar", status: "offline", cpu: 0, value: 0, id: "mock-4", initial: "B" },
        ];

        if (data.length < 4) {
            data = [...data, ...placeholders.slice(0, 4 - data.length)];
        }
        return data;
    }, [allPcsData]);

    const topDistricts = useMemo(() => {
        if (!allPcsData) return [];

        const districtScores = new Map<string, { totalCpu: number, count: number }>();

        // Group all PC scores by district
        allPcsData.forEach(pc => {
            const city = pc.city || 'Unknown';
            // Only aggregate if online and has a valid score when viewing active 
            if (pc.status === 'online' || viewMode === 'all') {
                const current = districtScores.get(city) || { totalCpu: 0, count: 0 };
                current.totalCpu += Number(pc.cpu_score) || 0;
                current.count += 1;
                districtScores.set(city, current);
            }
        });

        let data = Array.from(districtScores.entries())
            .map(([name, stats]) => ({
                name: name.toUpperCase(),
                cpu: stats.count > 0 ? Math.round(stats.totalCpu / stats.count) : 0,
                value: stats.count > 0 ? Math.round(stats.totalCpu / stats.count) : 0,
            }))
            .sort((a, b) => b.cpu - a.cpu)
            .slice(0, 5);

        const placeholders = [
            { name: "LAHORE", cpu: 0, value: 0 },
            { name: "RAWALPINDI", cpu: 0, value: 0 },
            { name: "FAISALABAD", cpu: 0, value: 0 },
            { name: "MULTAN", cpu: 0, value: 0 },
            { name: "GUJRANWALA", cpu: 0, value: 0 },
        ];

        if (data.length < 5) {
            data = [...data, ...placeholders.slice(0, 5 - data.length)];
        }
        return data;
    }, [allPcsData, viewMode]);

    const pieData = useMemo(() => {
        const onlineCount = labs.reduce((acc: number, l: any) => acc + Number(l.online || 0), 0);
        const totalCount = labs.reduce((acc: number, l: any) => acc + Number(l.total_pcs || 0), 0);
        const offlineCount = Math.max(0, totalCount - onlineCount);

        return [
            { name: 'Online', value: totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0, color: '#10b981' },
            { name: 'Offline', value: totalCount > 0 ? Math.round((offlineCount / totalCount) * 100) : 0, color: '#f43f5e' }
        ];
    }, [labs]);

    const summaryData = useMemo(() => {
        const pcList = allPcsData || [];
        const total = pcList.length;
        const online = pcList.filter(p => p.status === 'online').length;
        const offline = total - online;

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

        const offline7d = pcList.filter(p => {
            if (p.status === 'online') return false;
            if (!p.last_seen) return true;
            return new Date(p.last_seen) < sevenDaysAgo;
        }).length;

        const offline30d = pcList.filter(p => {
            if (p.status === 'online') return false;
            if (!p.last_seen) return true;
            return new Date(p.last_seen) < thirtyDaysAgo;
        }).length;

        return {
            total,
            online,
            offline,
            offline7d,
            offline30d,
            districts: citySet.size,
            tehsils: tehsilSet.size,
            labs: labs.length,
            health: total > 0 ? Math.round((online / total) * 100) : 0
        };
    }, [allPcsData, citySet, tehsilSet, labs]);


    return (
        <div className="min-h-screen bg-[#0F0A1E] text-slate-200 p-4 lg:p-6 font-sans animate-in fade-in duration-1000 selection:bg-violet-500/30">
            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
            </div>

            <div className="max-w-[1600px] mx-auto relative z-10 space-y-4">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-4 mb-1">
                            {viewLevel !== 'districts' && (
                                <button
                                    onClick={() => {
                                        if (viewLevel === 'labs') { setViewLevel('tehsils'); setSelectedTehsil(null); }
                                        else { setViewLevel('districts'); setSelectedDistrict(null); }
                                    }}
                                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all text-violet-400 mr-1"
                                >
                                    <ArrowUpRight className="w-4 h-4 rotate-[225deg]" />
                                </button>
                            )}
                            <div className="w-1.5 h-6 bg-violet-500 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
                            <h1 className="text-3xl font-black tracking-tight text-white font-display uppercase italic">
                                {viewLevel === 'districts' ? "District" : viewLevel === 'tehsils' ? selectedDistrict : selectedTehsil} <span className="text-violet-400 not-italic">Performance</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-3 text-slate-400 uppercase tracking-[0.3em] font-bold text-[9px] bg-white/[0.03] px-3 py-1 rounded-full border border-white/5 w-fit ml-4">
                            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-ping" />
                            {viewLevel === 'districts' ? "Regional Overview" : viewLevel === 'tehsils' ? "Tehsil Breakdown" : "Lab Specifics"}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <button
                            onClick={resetToGlobal}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.08] transition-all group hover:border-violet-500/20 shadow-xl"
                        >
                            <Activity size={16} className="text-slate-500 group-hover:text-violet-400 transition-colors" />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Global Reset</span>
                        </button>
                        <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-violet-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_15px_40px_rgba(124,58,237,0.4)]">
                            <Share2 size={16} />
                            Export Data
                        </button>
                    </div>
                </header>

                {/* Summary Cards */}
                {/* Infrastructure Node Cards */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            label: 'Total Districts',
                            value: summaryData.districts,
                            subLabel: 'REGIONAL NODES',
                            icon: Globe,
                            color: 'blue',
                            status: 'ACTIVE',
                            statusColor: 'emerald',
                            path: '/dashboard/overview'
                        },
                        {
                            label: 'Total Tehsils',
                            value: summaryData.tehsils,
                            subLabel: 'SUB-DIVISIONS',
                            icon: Landmark,
                            color: 'emerald',
                            status: 'MAPPED',
                            statusColor: 'emerald',
                            path: '/dashboard/cities'
                        },
                        {
                            label: 'Total Labs',
                            value: summaryData.labs,
                            subLabel: 'DEPLOYMENT SITES',
                            icon: Monitor,
                            color: 'purple',
                            status: 'NOMINAL',
                            statusColor: 'emerald',
                            path: '/dashboard/labs'
                        },
                        {
                            label: 'Total Systems',
                            value: summaryData.total,
                            subLabel: 'HARDWARE ASSETS',
                            icon: Cpu,
                            color: 'rose',
                            status: 'TRACKED',
                            statusColor: 'emerald',
                            path: '/dashboard/devices'
                        }
                    ].map((card, i) => (
                        <div
                            key={i}
                            onClick={() => navigate(card.path)}
                            className="bg-[#1a1b3a] rounded-[1.5rem] p-5 border border-white/5 relative group transition-all duration-300 hover:border-violet-500/30 shadow-2xl overflow-hidden h-36 flex flex-col justify-between cursor-pointer hover:-translate-y-1 hover:shadow-violet-500/10"
                        >
                            {/* Card Content */}
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Infrastructure Node</p>
                                        <h3 className="text-base font-extrabold text-white uppercase tracking-tight italic group-hover:text-blue-400 transition-colors leading-tight">
                                            {card.label}
                                        </h3>
                                    </div>
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-500",
                                        card.color === 'blue' ? "bg-blue-500/10 border-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]" :
                                            card.color === 'emerald' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]" :
                                                card.color === 'purple' ? "bg-purple-500/10 border-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]" :
                                                    "bg-rose-500/10 border-rose-500/20 text-rose-400 group-hover:bg-rose-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                                    )}>
                                        <card.icon size={16} />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-3xl font-black text-white italic tracking-tighter tabular-nums">
                                        {card.value}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none">{card.subLabel.split('-')[0].split(' ')[0]}</span>
                                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none">{card.subLabel.split('-')[0].split(' ')[1] || (card.subLabel.includes('-') ? card.subLabel.split('-')[1] : '')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-1 flex items-center justify-between">
                                <div className={cn(
                                    "px-3 py-1 rounded-full border text-[8px] font-black tracking-widest uppercase transition-all duration-300",
                                    card.statusColor === 'emerald' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)] group-hover:bg-emerald-500/20" :
                                        "bg-red-500/10 border-red-500/20 text-red-500 shadow-[inset_0_0_10px_rgba(239,68,68,0.1)] group-hover:bg-red-500/20 font-black"
                                )}>
                                    {card.status}
                                </div>
                                <div className="w-1 h-1 rounded-full bg-slate-800 animate-pulse group-hover:bg-white/40" />
                            </div>
                        </div>
                    ))}
                </section>

                {/* Middle Section: Line Chart & Donut */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-[#120d2b] rounded-[1.5rem] p-5 border border-white/5 relative overflow-hidden group shadow-2xl h-[400px] flex flex-col">
                        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-violet-600/5 blur-[80px] rounded-full group-hover:bg-violet-600/10 transition-all duration-1000" />
                        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter italic leading-none">Top Performing Districts</h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1.5">Average Hardware Utilization Matrix</p>
                            </div>
                            <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 w-full sm:w-auto">
                                {['ACTIVE', 'ALL'].map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode.toLowerCase() as any)}
                                        className={cn(
                                            "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-500",
                                            viewMode === mode.toLowerCase() ? "bg-violet-600 text-white shadow-[0_5px_15px_rgba(124,58,237,0.4)]" : "text-slate-500 hover:text-white"
                                        )}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={topDistricts} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 7, fontWeight: 900 }}
                                        dy={10}
                                        interval={0}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-[#120d2b]/95 border border-violet-500/20 p-4 rounded-xl shadow-2xl backdrop-blur-xl">
                                                        <p className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] mb-1">{payload[0].payload.name}</p>
                                                        <div className="flex items-center gap-3">
                                                            <div>
                                                                <p className="text-xl font-black text-white italic tracking-tighter leading-none">{payload[0].value}%</p>
                                                                <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">Avg Utilization</p>
                                                            </div>
                                                            <div className="w-px h-6 bg-white/10" />
                                                            <div>
                                                                <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest">Optimal</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="cpu"
                                        stroke="#8B5CF6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                        animationDuration={2000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-[#120d2b] rounded-[1.5rem] p-5 border border-white/5 relative overflow-hidden group shadow-2xl flex flex-col h-[400px]">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tighter italic leading-none">Network Health</h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1.5">Infrastructure Load</p>
                            </div>
                            <Activity size={18} className="text-violet-500 animate-pulse" />
                        </div>
                        <div className="flex-1 relative flex items-center justify-center scale-90 -my-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart width={100} height={100}>
                                    <Pie
                                        data={pieData}
                                        innerRadius="75%"
                                        outerRadius="90%"
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                        animationBegin={500}
                                        animationDuration={1500}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#8B5CF6' : 'rgba(255,255,255,0.03)'} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-white italic tracking-tighter leading-none">{summaryData.health}%</span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Efficiency</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            {pieData.map((item, i) => (
                                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: i === 0 ? '#8B5CF6' : 'rgba(255,255,255,0.1)' }} />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.name}</span>
                                    </div>
                                    <span className="text-lg font-black text-white italic">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Bottom Section: Table & Mini Chart */}
                <section className="grid grid-cols-1">
                    <div className="bg-[#120d2b] rounded-[1.5rem] p-5 border border-white/5 shadow-2xl relative overflow-hidden group h-[400px] flex flex-col">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter italic leading-none">System Intelligence Stream</h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-1.5">High-Utilization Assets</p>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-1.5 bg-violet-500/5 border border-violet-500/10 rounded-xl w-full sm:w-auto justify-center sm:justify-start">
                                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-ping" />
                                <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest">Active nodes</span>
                            </div>
                        </div>
                        <div className="overflow-hidden flex-1">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left border-b border-white/5">
                                        <th className="pb-3 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
                                            System Name
                                        </th>
                                        <th className="pb-3 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
                                            Zone / District
                                        </th>
                                        <th className="pb-3 text-right text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Usage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {topPcs.slice(0, 4).map((item: any, i) => (
                                        <tr
                                            key={i}
                                            className="group/row hover:bg-white/[0.02] transition-all cursor-default"
                                        >
                                            <td className="py-2">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white border border-white/10 shadow-2xl group-hover/row:scale-110 transition-transform duration-500",
                                                        i === 0 ? "bg-gradient-to-br from-violet-500 to-violet-700" :
                                                            i === 1 ? "bg-gradient-to-br from-purple-500 to-purple-700" :
                                                                "bg-gradient-to-br from-indigo-500 to-indigo-700"
                                                    )}>
                                                        {item.initial}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white uppercase tracking-tight leading-none mb-1 group-hover/row:text-violet-400 transition-colors">
                                                            {item.name}
                                                        </p>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={cn("w-1.5 h-1.5 rounded-full", item.status === 'online' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]")} />
                                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                                                                {item.status.toUpperCase()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2">
                                                <p className="text-xs font-bold text-white group-hover/row:translate-x-1 transition-transform duration-500">
                                                    {item.district}
                                                </p>
                                            </td>
                                            <td className="py-2 text-right">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all duration-500 group-hover/row:scale-105",
                                                    item.cpu > 80 ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/20" : "bg-violet-600/20 text-violet-400 border border-violet-500/20"
                                                )}>
                                                    <span>{item.cpu}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </section>

            </div>
        </div>
    );
}

// VERIFIED_FIX_12345
