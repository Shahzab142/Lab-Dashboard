import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Monitor, Wifi, WifiOff, Activity, Shield, Terminal, ArrowRight, Target, Zap, Waves } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from "@/lib/utils";
import { MiniWaveChart } from '@/components/dashboard/MiniWaveChart';

const LabSummaryPage = () => {
    const { city, lab } = useParams();
    const navigate = useNavigate();

    const { data: labsResponse, isLoading } = useQuery({
        queryKey: ['city-labs', city],
        queryFn: () => apiFetch(`/stats/city/${city}/labs`),
        enabled: !!city,
        refetchInterval: 5000,
    });

    const labData = labsResponse?.labs?.find((l: any) => l.lab_name === lab);

    // Dynamic Intensity for Wave Charts
    const getIntensity = (val: number, total: number) => Math.max(0.1, total > 0 ? (val / total) : 0);

    const stats = [
        {
            label: "TOTAL PC",
            value: labData?.total_pcs || 0,
            icon: Monitor,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            borderColor: "border-blue-500/20",
            glow: "glow-blue",
            waveColor: "#3b82f6",
            filter: "all",
            subtitle: "Global Node Inventory",
            intensity: 0.8
        },
        {
            label: "ONLINE PC",
            value: labData?.online || 0,
            icon: Wifi,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            borderColor: "border-emerald-500/20",
            glow: "glow-emerald",
            waveColor: "#10b981",
            filter: "online",
            subtitle: "Active Heartbeat Sync",
            intensity: getIntensity(labData?.online || 0, labData?.total_pcs || 1)
        },
        {
            label: "OFFLINE PC",
            value: labData?.offline || 0,
            icon: WifiOff,
            color: "text-red-400",
            bg: "bg-red-500/10",
            borderColor: "border-red-500/20",
            glow: "glow-red",
            waveColor: "#ef4444",
            filter: "offline",
            subtitle: "Connection Terminated",
            intensity: getIntensity(labData?.offline || 0, labData?.total_pcs || 1)
        }
    ];

    const allStats = [
        ...stats,
        {
            label: "7+ DAYS OFFLINE",
            value: labData?.offline_7d || 0,
            icon: Terminal,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            borderColor: "border-purple-500/20",
            glow: "glow-purple",
            waveColor: "#a855f7",
            filter: "offline",
            intensity: getIntensity(labData?.offline_7d || 0, labData?.total_pcs || 1)
        },
        {
            label: "30+ DAYS OFFLINE",
            value: labData?.offline_30d || 0,
            icon: Target,
            color: "text-pink-400",
            bg: "bg-pink-500/10",
            borderColor: "border-pink-500/20",
            glow: "glow-pink",
            waveColor: "#ec4899",
            filter: "offline",
            intensity: getIntensity(labData?.offline_30d || 0, labData?.total_pcs || 1)
        }
    ];

    if (isLoading) {
        return (
            <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20">
                    {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-64 rounded-[2rem] bg-white/5" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-12 animate-in fade-in duration-700 min-h-screen bg-[#030303] text-white overflow-x-hidden">
            {/* Elegant Background elements */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1a1a1a,transparent)] pointer-events-none" />
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* TOP NAVIGATION BAR */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-8">
                <div className="flex items-center gap-6">
                    <Button
                        onClick={() => navigate(`/dashboard/lab-analytics?city=${city}`)}
                        className="bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl w-14 h-14 flex items-center justify-center group transition-all"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">Core Lab Dashboard</span>

                            <div className="w-1 h-1 bg-white/30 rounded-full" />
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest italic">{city}</span>
                        </div>
                        <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                            {lab} <span className="text-white/20">SEGMENT</span>
                        </h1>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-10">
                    <Button
                        onClick={async () => {
                            const { generateDynamicReport } = await import('@/lib/pdf-generator');
                            await generateDynamicReport('LAB', labData, lab);
                        }}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white gap-2 px-6 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest transition-all group backdrop-blur-xl mr-4"
                    >
                        <Zap size={16} className="text-primary group-hover:scale-110 transition-transform" />
                        generate dailybasePDF
                    </Button>

                    {[
                        { label: "STABILITY", value: "99.9%", icon: Activity },
                        { label: "STATUS", value: "ENCRYPTED", icon: Shield },
                        { label: "THREATS", value: labData?.offline_30d || 0, icon: Target },
                    ].map((m, i) => (
                        <div key={i} className="flex flex-col items-end">
                            <div className="flex items-center gap-2 mb-1">
                                <m.icon size={10} className="text-primary" />
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">{m.label}</span>
                            </div>
                            <span className="text-[12px] font-black uppercase tracking-widest">{m.value}</span>
                        </div>
                    ))}
                </div>

            </div>

            {/* CORE METRICS - TOP ROW (3 CARDS) */}
            <div className="relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {allStats.slice(0, 3).map((stat, i) => (
                        <div
                            key={i}
                            onClick={() => navigate(`/dashboard/devices?city=${city}&lab=${lab}&status=${stat.filter}`)}
                            className={cn(
                                "group glass-card premium-border rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 hover:translate-y-[-8px] relative overflow-hidden flex flex-col justify-between min-h-[220px]",
                                stat.glow
                            )}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className={cn("p-4 rounded-2xl bg-white/5 border transition-all duration-500 group-hover:scale-110 shadow-inner", stat.borderColor)}>
                                    <stat.icon size={26} className={stat.color} />
                                </div>
                                <div className="bg-black/20 p-2.5 rounded-xl border border-white/5 backdrop-blur-xl">
                                    <MiniWaveChart
                                        color={stat.waveColor}
                                        width={140}
                                        height={55}
                                        intensity={stat.intensity}
                                        showGrid={true}
                                    />
                                </div>
                            </div>

                            <div className="relative z-10 mt-auto">
                                <div className={cn("border-l-2 pl-4 mb-2 transition-all group-hover:pl-6", stat.borderColor)}>
                                    <p className={cn("text-[12px] font-black uppercase tracking-[0.3em] mb-1 italic transition-colors", stat.color)}>
                                        {stat.label}
                                    </p>
                                </div>
                                <div className="flex items-baseline gap-3">
                                    <h2 className="text-6xl font-black italic tracking-tighter text-white leading-none transition-all duration-500 group-hover:scale-105">
                                        {stat.value}
                                    </h2>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+12.4%</span>
                                        <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest italic">Growth</span>
                                    </div>
                                </div>
                            </div>
                            <div className={cn("absolute -right-10 -bottom-10 w-48 h-48 blur-[100px] opacity-10 rounded-full", stat.bg)} />
                        </div>
                    ))}
                </div>
            </div>

            {/* ALERT METRICS - BOTTOM ROW (MATCHING SIZES) */}
            <div className="relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {allStats.slice(3).map((stat, i) => (
                        <div
                            key={i}
                            onClick={() => navigate(`/dashboard/devices?city=${city}&lab=${lab}&status=${stat.filter}`)}
                            className={cn(
                                "group glass-card premium-border rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 hover:translate-y-[-8px] relative overflow-hidden flex flex-col justify-between min-h-[220px]",
                                stat.glow
                            )}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className={cn("relative p-4 rounded-2xl bg-white/5 border transition-all duration-500 group-hover:scale-110 shadow-inner", stat.borderColor)}>
                                    <stat.icon size={26} className={stat.color} />
                                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-lg">ALERT</div>
                                </div>
                                <div className="bg-black/20 p-2.5 rounded-xl border border-white/5 backdrop-blur-xl">
                                    <MiniWaveChart
                                        color={stat.waveColor}
                                        width={140}
                                        height={55}
                                        intensity={stat.intensity}
                                        showGrid={true}
                                    />
                                </div>
                            </div>

                            <div className="relative z-10 mt-auto">
                                <div className={cn("border-l-2 pl-4 mb-2 transition-all group-hover:pl-6", stat.borderColor)}>
                                    <p className={cn("text-[12px] font-black uppercase tracking-[0.3em] mb-1 italic transition-colors", stat.color)}>
                                        {stat.label}
                                    </p>
                                </div>
                                <div className="flex items-baseline gap-3">
                                    <h2 className="text-6xl font-black italic tracking-tighter text-white leading-none transition-all duration-500 group-hover:scale-105">
                                        {stat.value}
                                    </h2>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Critical</span>
                                        <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest italic">Node Status</span>
                                    </div>
                                </div>
                            </div>
                            <div className={cn("absolute -right-10 -bottom-10 w-48 h-48 blur-[100px] opacity-10 rounded-full", stat.bg)} />
                        </div>
                    ))}
                </div>
            </div>

            {/* PRESENTATION FOOTER */}
            <div className="relative z-10 pt-16 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/5">
                <div className="flex gap-12">
                    <div className="group cursor-default">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.5em] mb-1.5 transition-colors group-hover:text-primary">System Branch</p>
                        <p className="text-xs font-black text-white/60 uppercase italic tracking-widest">{city} • SECTOR CLUSTER</p>
                    </div>
                </div>

                <div className="text-center md:text-right space-y-1">
                    <p className="text-[11px] font-black text-white/30 tracking-widest italic uppercase">© 2026 Lab Guardian • Core Intelligence systems</p>
                    <p className="text-[9px] font-bold text-primary/40 uppercase tracking-[0.8em] italic">V2.0 PRO INFRASTRUCTURE</p>
                </div>
            </div>
        </div>
    );
};

export default LabSummaryPage;
