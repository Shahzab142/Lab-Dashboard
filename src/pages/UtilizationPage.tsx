import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
    Activity,
    Monitor,
    Zap,
    Clock,
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    Search,
    ChevronRight,
    Building2,
    Calendar,
    Flame,
    ArrowLeft,
    FileText,
    ArrowRight,
    WifiOff,
    Wifi
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// Configuration for usage detection
const CPU_ACTIVITY_THRESHOLD = 12; // Above this, lab is considered "active"
const IDLE_TIME_WINDOW = 60 * 60 * 1000; // 60 minute window for stable heartbeat

export default function UtilizationPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");

    const { data: devices, isLoading } = useQuery({
        queryKey: ["admin-main-metrics"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("devices")
                .select("*");
            if (error) throw error;
            return data;
        },
        refetchInterval: 10000,
    });

    // 🧠 LOGICAL ENGINE: Infrastructure Analysis
    const analytics = useMemo(() => {
        if (!devices) return null;

        const now = new Date();
        const labsMap = new Map<string, any[]>();

        // Group by lab with strict normalization (matching server's Tehsil-aware grouping)
        devices.forEach(d => {
            const normCity = (d.city || 'GENERAL').toUpperCase().trim();
            const normTehsil = (d.tehsil || 'UNKNOWN').toUpperCase().trim();
            const normLab = (d.lab_name || 'UNASSIGNED').toUpperCase().trim();
            const labKey = `${normCity}-${normTehsil}-${normLab}`;

            if (!labsMap.has(labKey)) labsMap.set(labKey, []);
            labsMap.get(labKey)?.push(d);
        });

        const metrics = {
            usedLabs: [] as any[],
            idleLabs: [] as any[], // "Formality" labs
            offlineLabs: [] as any[],
            offline7d: [] as any[],
            offline30d: [] as any[]
        };

        labsMap.forEach((labDevices, key) => {
            const onlinePCs = labDevices.filter(d => {
                const lastSeen = d.last_seen ? new Date(d.last_seen) : null;
                // Standardizing online check: Must be 'online' AND pinged within the last 2 hours to be safe against stale data
                return d.status === 'online' && lastSeen && (now.getTime() - lastSeen.getTime() < 2 * 60 * 60 * 1000);
            });

            const totalInLab = labDevices.length;
            const onlineCount = onlinePCs.length;

            const maxLastSeen = labDevices.reduce((max, d) => {
                const dTime = d.last_seen ? new Date(d.last_seen).getTime() : 0;
                return Math.max(max, dTime);
            }, 0);

            const lastSeenDiffDays = maxLastSeen === 0 ? 999 : (now.getTime() - maxLastSeen) / (1000 * 3600 * 24);

            const labInfo = {
                id: key,
                name: labDevices[0].lab_name,
                city: labDevices[0].city,
                tehsil: labDevices[0].tehsil,
                total: totalInLab,
                online: onlineCount,
                avgCpu: onlineCount > 0
                    ? onlinePCs.reduce((acc, pc) => acc + (pc.cpu_score || 0), 0) / onlineCount
                    : 0
            };

            // ⚖️ RIGOROUS LOGIC: Matching the audit criteria exactly
            if (onlineCount > 0) {
                // If any system is actually processing (>10%) or the average load is noticeable (>5%), it's being "Used".
                // Otherwise, it was just turned on for "Formality" (Idle).
                const isWorking = onlinePCs.some(pc => (pc.cpu_score || 0) > 10) || labInfo.avgCpu > 5;

                if (isWorking) {
                    metrics.usedLabs.push(labInfo);
                } else {
                    metrics.idleLabs.push(labInfo); // THE MISUSE CASE (Formality)
                }
            } else {
                // Explicitly Mutually Exclusive Offline Tracking
                if (lastSeenDiffDays >= 30) {
                    metrics.offline30d.push(labInfo);
                } else if (lastSeenDiffDays >= 7) {
                    metrics.offline7d.push(labInfo);
                } else {
                    metrics.offlineLabs.push(labInfo);
                }
            }
        });

        return metrics;
    }, [devices]);

    const handleCardClick = (id: string) => {
        if (id === 'used') navigate('/dashboard/labs?audit=used');
        else if (id === 'idle') navigate('/dashboard/labs?audit=idle');
        else if (id === 'offline') navigate('/dashboard/labs?status=offline');
        else if (id === '7days') navigate('/dashboard/labs?status=offline_7d');
        else if (id === '30days') navigate('/dashboard/labs?status=offline_30d');
    };

    if (isLoading) return (
        <div className="p-10 bg-background min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Activity className="w-12 h-12 text-primary animate-spin" />
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] animate-pulse">Synchronizing Fleet Telemetry...</p>
            </div>
        </div>
    );

    const cardsMapping = [
        {
            id: 'used',
            label: 'Used Labs',
            count: analytics?.usedLabs.length || 0,
            icon: Flame,
            color: 'text-emerald-500',
            metricLabel: 'Live Sync',
            statusBadge: 'Nominal',
            badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        },
        {
            id: 'idle',
            label: 'Idle (Formality)',
            count: analytics?.idleLabs.length || 0,
            icon: AlertTriangle,
            color: 'text-amber-500',
            metricLabel: 'Zero Load',
            statusBadge: 'Critical',
            badgeColor: 'bg-red-500/10 text-red-500 border-red-500/20'
        },
        {
            id: 'offline',
            label: 'Offline Labs',
            count: analytics?.offlineLabs.length || 0,
            icon: WifiOff,
            color: 'text-red-500',
            metricLabel: 'Down Time',
            statusBadge: 'Nominal',
            badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        },
        {
            id: '7days',
            label: '7 Days+ Offline',
            count: analytics?.offline7d.length || 0,
            icon: Calendar,
            color: 'text-orange-500',
            metricLabel: 'Alert Nodes',
            statusBadge: 'Critical',
            badgeColor: 'bg-red-500/10 text-red-500 border-red-500/20'
        },
        {
            id: '30days',
            label: 'One Month+ Offline',
            count: analytics?.offline30d.length || 0,
            icon: ShieldAlert,
            color: 'text-white',
            metricLabel: 'Alert Nodes',
            statusBadge: 'Critical',
            badgeColor: 'bg-red-500/10 text-red-500 border-red-500/20'
        }
    ];

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* TOP NAVIGATION BAR (MAKING IT MATCH LAB SUMMARY) */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
                <div className="flex items-center gap-6">
                    <Button
                        onClick={() => navigate('/dashboard/analytics')}
                        variant="ghost"
                        size="icon"
                        className="bg-card border border-border hover:bg-muted rounded-lg w-12 h-12 flex items-center justify-center group transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-primary" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight uppercase text-white font-display leading-tight">
                            Lab Utilization <span className="text-white/80">Summary</span>
                        </h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        onClick={() => navigate(`/dashboard/labs`)}
                        className="bg-primary hover:bg-primary/90 text-black gap-2 px-4 rounded-lg h-9 text-[9px] font-bold uppercase tracking-widest transition-all shadow-sm"
                    >
                        <ArrowRight size={13} />
                        View All Labs
                    </Button>

                    <Button
                        onClick={async () => {
                            const toastId = (await import('sonner')).toast.loading(`Synthesizing global fleet audit...`);
                            try {
                                const { generateDynamicReport } = await import('@/lib/pdf-generator');
                                await generateDynamicReport('GLOBAL', { locations: analytics?.usedLabs || [] }); // Simplified placeholder
                                (await import('sonner')).toast.success("Infrastructure Audit Ready", { id: toastId });
                            } catch (e) {
                                console.error(e);
                                (await import('sonner')).toast.error("Audit Generation Failed", { id: toastId });
                            }
                        }}
                        className="bg-white hover:bg-white/90 text-black gap-2 px-4 rounded-lg h-9 text-[9px] font-bold uppercase tracking-widest transition-all shadow-lg"
                    >
                        <FileText size={13} />
                        Generate PPTX
                    </Button>
                </div>
            </div>

            {/* PREMIUM 5-CARD GRID (MATCHING LAB SUMMARY STYLE) */}
            <div className="relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {cardsMapping.map((card, i) => (
                        <Card
                            key={card.id}
                            onClick={() => handleCardClick(card.id)}
                            className="group relative overflow-hidden bg-card cursor-pointer border border-border hover:border-primary/40 transition-all hover:translate-y-[-4px] shadow-sm hover:shadow-lg rounded-2xl min-h-[160px]"
                        >
                            <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                                            Infrastructure Node
                                        </h3>
                                        <h2 className="text-sm font-bold tracking-tight text-white group-hover:text-white/80 transition-colors uppercase">
                                            {card.label}
                                        </h2>
                                    </div>
                                    <div className={cn(
                                        "p-2 rounded-lg bg-background border border-border shadow-inner transition-colors group-hover:border-primary/30",
                                        card.color
                                    )}>
                                        <card.icon size={16} />
                                    </div>
                                </div>

                                <div className="flex items-end justify-between border-t border-border pt-4">
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-4xl font-bold text-white tracking-tight leading-none">{card.count}</span>
                                        <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">
                                            {card.metricLabel}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "flex items-baseline gap-1.5 px-3 py-1 rounded-full border shadow-sm transition-all",
                                        card.badgeColor
                                    )}>
                                        <span className={cn(
                                            "text-[9px] font-bold uppercase tracking-wider"
                                        )}>
                                            {card.statusBadge}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Audit Table Section (Dark Theme Matching) */}
            <section className="space-y-6 animate-in fade-in duration-1000 delay-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight uppercase text-white font-display">LabWise Utilization Summary</h2>
                        </div>
                    </div>

                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all w-4 h-4" />
                        <Input
                            placeholder="SEARCH DISTRICT OR LAB..."
                            className="pl-12 bg-card border-border text-[9px] font-bold uppercase tracking-widest h-11 rounded-xl focus:ring-primary/20 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-left bg-muted/50 border-b border-border">
                                    <th className="px-8 py-5">Facility Identification</th>
                                    <th className="px-8 py-5">Fleet Status</th>
                                    <th className="px-8 py-5">Compute Load</th>
                                    <th className="px-8 py-5">Audit Conclusion</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {Object.values(analytics || {}).flat().filter(l =>
                                    !searchTerm ||
                                    l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    l.city?.toLowerCase().includes(searchTerm.toLowerCase())
                                ).map((lab, i) => {
                                    const isIdle = analytics?.idleLabs.some(il => il.id === lab.id);
                                    const isUsed = analytics?.usedLabs.some(ul => ul.id === lab.id);
                                    const isOffline7d = analytics?.offline7d.some(ol => ol.id === lab.id);
                                    const isOffline30d = analytics?.offline30d.some(ol => ol.id === lab.id);

                                    return (
                                        <tr
                                            key={lab.id}
                                            onClick={() => navigate(`/dashboard/devices?city=${encodeURIComponent(lab.city)}&lab=${encodeURIComponent(lab.name)}&tehsil=${encodeURIComponent(lab.tehsil)}`)}
                                            className="hover:bg-muted/30 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center shrink-0 shadow-inner group-hover:border-primary/30 transition-colors">
                                                        <Building2 size={18} className="text-primary/60" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-white uppercase tracking-tight">{lab.name}</p>
                                                        <div className="flex gap-2 mt-1">
                                                            <span className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">{lab.city}</span>
                                                            <span className="text-[9px] font-bold text-muted-foreground/30">•</span>
                                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{lab.tehsil}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-1.5 w-24 bg-background rounded-full overflow-hidden border border-border">
                                                            <div
                                                                className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(249,154,29,0.4)]"
                                                                style={{ width: `${(lab.online / lab.total) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-white">{lab.online}/{lab.total}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-baseline gap-2">
                                                    <span className={cn(
                                                        "text-base font-bold",
                                                        lab.avgCpu > 10 ? "text-emerald-400" : "text-white/40"
                                                    )}>
                                                        {lab.avgCpu.toFixed(1)}%
                                                    </span>
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Avg</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {isIdle ? (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
                                                        <AlertTriangle size={12} className="animate-pulse" />
                                                        <span className="text-[9px] font-bold uppercase tracking-wider">Idle (Formality)</span>
                                                    </div>
                                                ) : isUsed ? (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                                        <Flame size={12} />
                                                        <span className="text-[9px] font-bold uppercase tracking-wider">Active Used</span>
                                                    </div>
                                                ) : isOffline30d ? (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-600/50 text-white">
                                                        <ShieldAlert size={12} />
                                                        <span className="text-[9px] font-bold uppercase tracking-wider">One Month+ Offline</span>
                                                    </div>
                                                ) : isOffline7d ? (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-500">
                                                        <Calendar size={12} className="animate-pulse" />
                                                        <span className="text-[9px] font-bold uppercase tracking-wider">7 Days+ Offline</span>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                                                        <WifiOff size={12} />
                                                        <span className="text-[9px] font-bold uppercase tracking-wider">Offline Recently</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-9 h-9 bg-background hover:bg-primary hover:text-black border border-border rounded-lg"
                                                >
                                                    <ChevronRight size={14} />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
