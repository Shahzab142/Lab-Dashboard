import { useState, useEffect } from "react";
import { Grid3X3, Monitor, CheckCircle2, Flame, WifiOff, Map } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PUNJAB_HIERARCHY } from "@/lib/locationHierarchy";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function LabHeatmap() {
    const [district, setDistrict] = useState<string>("");
    const [tehsil, setTehsil] = useState<string>("");
    const [lab, setLab] = useState<string>("");

    const [loading, setLoading] = useState(false);
    const [devices, setDevices] = useState<any[]>([]);

    const [selectedPC, setSelectedPC] = useState<any>(null);

    useEffect(() => {
        if (district && tehsil && lab) {
            fetchLabData();
        }
    }, [lab]);

    const fetchLabData = async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`/devices?city=${district}&lab=${lab}`);
            setDevices(res.devices || []);
        } catch (error) {
            toast.error("Failed to map lab infrastructure");
        } finally {
            setLoading(false);
        }
    };

    // Prepare a dynamic grid based on device count
    // A standard lab might have 30 PCs, so maybe a 6x5 grid.
    const columns = 6;
    const rows = Math.max(5, Math.ceil(devices.length / columns));
    const gridSpaces = Array.from({ length: columns * rows }, (_, i) => i);

    return (
        <div className="p-4 md:p-8 min-h-[calc(100vh-2rem)] animate-in fade-in duration-700 bg-background text-foreground flex flex-col">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase text-white font-display flex items-center gap-3">
                        <Grid3X3 className="text-secondary w-8 h-8" />
                        Infrastructure <span className="text-secondary">Blueprint</span>
                    </h1>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mt-1">Visual Heatmap & Facility Floorplan</p>
                </div>

                <div className="flex gap-3 bg-card p-2 rounded-xl border border-border">
                    <Select value={district} onValueChange={d => { setDistrict(d); setTehsil(""); setLab(""); }}>
                        <SelectTrigger className="w-32 h-9 text-[10px] font-bold uppercase min-w-[120px] bg-background">
                            <SelectValue placeholder="DISTRICT" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.keys(PUNJAB_HIERARCHY).sort().map(d => (
                                <SelectItem key={d} value={d} className="text-[10px] font-bold uppercase">{d}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={tehsil} onValueChange={t => { setTehsil(t); setLab(""); }} disabled={!district}>
                        <SelectTrigger className="w-32 h-9 text-[10px] font-bold uppercase min-w-[120px] bg-background">
                            <SelectValue placeholder="TEHSIL" />
                        </SelectTrigger>
                        <SelectContent>
                            {district && PUNJAB_HIERARCHY[district] && Object.keys(PUNJAB_HIERARCHY[district]).sort().map(t => (
                                <SelectItem key={t} value={t} className="text-[10px] font-bold uppercase">{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={lab} onValueChange={setLab} disabled={!tehsil}>
                        <SelectTrigger className="w-40 h-9 text-[10px] font-bold uppercase min-w-[150px] bg-background">
                            <SelectValue placeholder="LABORATORY" />
                        </SelectTrigger>
                        <SelectContent>
                            {district && tehsil && PUNJAB_HIERARCHY[district][tehsil] && PUNJAB_HIERARCHY[district][tehsil].sort().map(l => (
                                <SelectItem key={l} value={l} className="text-[10px] font-bold uppercase">{l}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Heatmap Area */}
            <div className="flex-1 bg-black/40 rounded-3xl border border-white/5 p-8 relative overflow-auto flex items-center justify-center min-h-[500px]">
                {loading ? (
                    <div className="animate-pulse flex flex-col items-center">
                        <Grid3X3 className="w-12 h-12 text-primary/50 animate-spin-slow mb-4" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/50">Rendering Floorplan...</span>
                    </div>
                ) : !lab ? (
                    <div className="text-center opacity-30">
                        <Map className="w-16 h-16 mx-auto mb-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">Select Facility to View Blueprint</span>
                    </div>
                ) : (
                    <div className="relative w-full max-w-5xl mx-auto">
                        {/* Instructor Desk Marker */}
                        <div className="w-full h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center mb-16 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Instructor Stage / Whiteboard</span>
                        </div>

                        {/* Desks Grid */}
                        <div
                            className="grid gap-6 md:gap-x-12 md:gap-y-10"
                            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                        >
                            {gridSpaces.map(index => {
                                const device = devices[index];

                                if (!device) {
                                    return <div key={index} className="aspect-square border border-white/5 rounded-2xl border-dashed opacity-10 blur-[1px]" />;
                                }

                                const isDefective = JSON.parse(localStorage.getItem('defective_devices') || '[]').includes(device.system_id);
                                const isOnline = device.status === 'online';
                                const cpuLoad = device.cpu_score || 0;
                                const isWorking = isOnline && cpuLoad > 10;

                                let glowStyle = "";
                                let iconStyle = "text-white/20";
                                let IconToUse = Monitor;

                                if (isDefective) {
                                    glowStyle = "bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]";
                                    iconStyle = "text-yellow-500";
                                } else if (!isOnline) {
                                    glowStyle = "bg-red-500/5 border-red-500/20";
                                    iconStyle = "text-red-500/50";
                                    IconToUse = WifiOff;
                                } else if (isWorking) {
                                    glowStyle = "bg-primary/20 border-primary shadow-[0_0_30px_rgba(249,154,29,0.3)] scale-110 z-10";
                                    iconStyle = "text-primary";
                                    IconToUse = Flame;
                                } else {
                                    glowStyle = "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
                                    iconStyle = "text-emerald-400";
                                    IconToUse = CheckCircle2;
                                }

                                return (
                                    <div
                                        key={index}
                                        onClick={() => setSelectedPC(device)}
                                        className={`group aspect-square rounded-2xl border flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-300 hover:scale-110 ${glowStyle}`}
                                    >
                                        <IconToUse className={`w-8 h-8 mb-2 transition-transform group-hover:-translate-y-1 ${iconStyle}`} />
                                        <div className="text-center w-full">
                                            <p className="text-[10px] font-black text-white truncate px-1 uppercase leading-tight">{device.pc_name || `PC-${index + 1}`}</p>
                                            {isOnline && !isDefective && <p className={`text-[8px] font-bold ${isWorking ? 'text-primary' : 'text-white/40'}`}>{cpuLoad.toFixed(0)}% LOAD</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Tooltip Dialog */}
            <Dialog open={!!selectedPC} onOpenChange={() => setSelectedPC(null)}>
                <DialogContent className="bg-card border-white/10 sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase text-white flex items-center gap-3 border-b border-white/5 pb-4">
                            <Monitor className="text-primary w-6 h-6" />
                            {selectedPC?.pc_name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                            <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Hardware ID</span>
                            <span className="text-xs font-mono text-white">{selectedPC?.system_id}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                            <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Current Status</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-black/30 ${selectedPC?.status === 'online' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {selectedPC?.status}
                            </span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                            <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">CPU Compute Load</span>
                            <span className="text-xl font-black text-primary">{selectedPC?.cpu_score?.toFixed(1) || 0}%</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
