import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Monitor, Wifi, WifiOff, Terminal, ArrowRight, Target, Zap, FileText } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from "@/lib/utils";
import { AddDeviceDialog } from "@/components/dashboard/AddDeviceDialog";

const LabSummaryPage = () => {
    const { city, lab } = useParams();
    const navigate = useNavigate();

    const { data: labsResponse, isLoading } = useQuery({
        queryKey: ['city-labs', city],
        queryFn: () => apiFetch(`/stats/city/${encodeURIComponent(city || '')}/labs`),
        enabled: !!city,
        refetchInterval: 5000,
    });

    const { data: devicesResponse, isLoading: devicesLoading } = useQuery({
        queryKey: ['lab-inventory', city, lab],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('devices')
                .select('*')
                .ilike('city', city || '')
                .ilike('lab_name', lab || '');

            if (error) throw error;
            return { devices: data || [], server_time: new Date().toISOString() };
        },
        enabled: !!city && !!lab,
        refetchInterval: 5000,
    });

    const normalize = (name: string) => (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const labData = labsResponse?.labs?.find((l: any) => normalize(l.lab_name) === normalize(lab || ''));
    const devices = devicesResponse?.devices || [];
    const serverTime = devicesResponse?.server_time || new Date().toISOString();

    // Persistent Defective Logic using LocalStorage
    const defectiveFromStorage = JSON.parse(localStorage.getItem('defective_devices') || '[]');

    // Calculate all stats from the fresh device list and inject persistent defective state
    const processedDevices = devices.map((d: any) => ({
        ...d,
        is_defective: d.is_defective || defectiveFromStorage.includes(d.system_id || d.id)
    }));

    const defectiveCount = processedDevices.filter((d: any) => d.is_defective).length;
    const onlineCount = processedDevices.filter((d: any) => d.status === 'online' && !d.is_defective).length;
    const offlineCount = processedDevices.filter((d: any) => d.status === 'offline' && !d.is_defective).length;
    const totalCount = processedDevices.length;

    const getOfflineCount = (days: number) => {
        const now = new Date(serverTime);
        return processedDevices.filter((d: any) => {
            if (d.is_defective) return false;
            if (d.status !== 'offline') return false;
            if (!d.last_seen) return true;
            const lastSeen = new Date(d.last_seen);
            const diffDays = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);
            return diffDays >= days;
        }).length;
    };

    const offline7d = getOfflineCount(7);
    const offline30d = getOfflineCount(30);

    // Dynamic Intensity for Wave Charts
    const getIntensity = (val: number, total: number) => Math.max(0.1, total > 0 ? (val / total) : 0);

    const stats = [
        {
            label: "Total System",
            value: totalCount,
            icon: Monitor,
            color: "text-primary",
            bg: "bg-primary/5",
            borderColor: "border-primary/20",
            waveColor: "#01416D",
            filter: "all",
            subtitle: "Total System Inventory",
            intensity: 0.8
        },
        {
            label: "Online System",
            value: onlineCount,
            icon: Wifi,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            borderColor: "border-emerald-500/20",
            waveColor: "#10b981",
            filter: "online",
            subtitle: "Active Heartbeat Sync",
            intensity: getIntensity(onlineCount, totalCount || 1)
        },
        {
            label: "Offline System",
            value: offlineCount,
            icon: WifiOff,
            color: "text-red-500",
            bg: "bg-red-500/10",
            borderColor: "border-red-500/20",
            waveColor: "#ef4444",
            filter: "offline",
            subtitle: "Connection Terminated",
            intensity: getIntensity(offlineCount, totalCount || 1)
        }
    ];

    const allStats = [
        ...stats,
        {
            label: "7 Days+ Offline PCs",
            value: offline7d,
            icon: Terminal,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
            borderColor: "border-orange-500/20",
            waveColor: "#f97316",
            filter: "offline_7d",
            intensity: getIntensity(offline7d, totalCount || 1)
        },
        {
            label: "One Month+ Offline PCs",
            value: offline30d,
            icon: Target,
            color: "text-white",
            bg: "bg-secondary/5",
            borderColor: "border-secondary/20",
            waveColor: "#f99a1d",
            filter: "offline_30d",
            intensity: getIntensity(offline30d, totalCount || 1)
        },
        {
            label: "Defective System",
            value: defectiveCount,
            icon: Zap,
            color: "text-yellow-500",
            bg: "bg-yellow-500/10",
            borderColor: "border-yellow-500/20",
            waveColor: "#eab308",
            filter: "defective",
            intensity: getIntensity(defectiveCount, totalCount || 1)
        }
    ];

    if (isLoading || devicesLoading) {
        return (
            <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 pt-20">
                    {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-40 rounded-2xl bg-card" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* TOP NAVIGATION BAR */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
                <div className="flex items-center gap-6">
                    <Button
                        onClick={() => navigate(`/dashboard/labs?city=${city}`)}
                        variant="ghost"
                        size="icon"
                        className="bg-card border border-border hover:bg-muted rounded-lg w-12 h-12 flex items-center justify-center group transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-primary" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Lab Overview</span>
                            <div className="w-1 h-1 bg-secondary rounded-full" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{labData?.city || city} District</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight uppercase text-white font-display leading-tight">
                            {labData?.lab_name || lab} <span className="text-white/80">Summary</span>
                        </h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* QUICK NAV BUTTONS - TOP */}
                    <Button
                        onClick={() => navigate(`/dashboard/devices?city=${city}&lab=${lab}`)}
                        className="bg-primary hover:bg-primary/90 text-black gap-2 px-4 rounded-lg h-9 text-[9px] font-bold uppercase tracking-widest transition-all shadow-sm"
                    >
                        <ArrowRight size={13} />
                        View All Systems
                    </Button>

                    <AddDeviceDialog
                        defaultCity={labData?.city || city}
                        defaultLab={labData?.lab_name || lab}
                        defaultTehsil={labData?.tehsil || labData?.norm_tehsil}
                    />
                    <Button
                        onClick={() => navigate(`/dashboard/devices?city=${city}&lab=${lab}&status=online`)}
                        variant="outline"
                        className="gap-2 px-4 rounded-lg h-9 text-[9px] font-bold uppercase tracking-widest text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 transition-all"
                    >
                        <Wifi size={13} />
                        View Online
                    </Button>
                    <Button
                        onClick={() => navigate(`/dashboard/devices?city=${city}&lab=${lab}&status=offline`)}
                        variant="outline"
                        className="gap-2 px-4 rounded-lg h-9 text-[9px] font-bold uppercase tracking-widest text-red-400 border-red-500/30 hover:bg-red-500/10 transition-all"
                    >
                        <WifiOff size={13} />
                        View Offline
                    </Button>

                    <div className="w-px h-8 bg-border mx-1" />

                    <Button
                        onClick={async () => {
                            const toastId = (await import('sonner')).toast.loading(`Synthesizing audit for ${lab}...`);
                            try {
                                const { generateDynamicReport } = await import('@/lib/pdf-generator');
                                await generateDynamicReport('LAB', {
                                    ...labData,
                                    devices: processedDevices
                                }, lab);
                                (await import('sonner')).toast.success("Facility Audit Ready", { id: toastId });
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

            {/* CORE METRICS GRID */}
            <div className="relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {allStats.map((stat, i) => (
                        <Card
                            key={i}
                            onClick={() => navigate(`/dashboard/devices?city=${city}&lab=${lab}&status=${stat.filter}`)}
                            className="group relative overflow-hidden bg-card cursor-pointer border border-border hover:border-primary/40 transition-all hover:translate-y-[-4px] shadow-sm hover:shadow-lg rounded-2xl min-h-[160px]"
                        >
                            <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                                            Infrastructure Node
                                        </h3>
                                        <h2 className="text-sm font-bold tracking-tight text-white group-hover:text-white/80 transition-colors uppercase">
                                            {stat.label}
                                        </h2>
                                    </div>
                                    <div className={cn(
                                        "p-2 rounded-lg bg-background border border-border shadow-inner transition-colors group-hover:border-primary/30",
                                        stat.color
                                    )}>
                                        <stat.icon size={16} />
                                    </div>
                                </div>

                                <div className="flex items-end justify-between border-t border-border pt-4">
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-3xl font-bold text-white tracking-tight leading-none">{stat.value}</span>
                                        <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">
                                            {i === 0 ? "Total Units" : i === 1 ? "Live Sync" : i === 2 ? "Down Time" : "Alert Nodes"}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "flex items-baseline gap-1.5 px-3 py-1 rounded-full border shadow-sm transition-all",
                                        i >= 3 ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"
                                    )}>
                                        <span className={cn(
                                            "text-[9px] font-bold uppercase tracking-wider",
                                            i >= 3 ? "text-red-400" : "text-emerald-400"
                                        )}>
                                            {i >= 3 ? "Critical" : "Nominal"}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default LabSummaryPage;
