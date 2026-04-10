import { useState, useRef, useEffect } from "react";
import { Terminal, Power, RotateCcw, DownloadCloud, Wrench, ShieldAlert, CheckCircle2, Search, MonitorPlay } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

export default function TerminalCommandCenter() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPC, setSelectedPC] = useState<any>(null);
    const [devices, setDevices] = useState<any[]>([]);

    // Terminal State
    const [logs, setLogs] = useState<{ time: string; text: string; type: 'info' | 'success' | 'warning' | 'error' | 'command' }[]>([
        { time: new Date().toLocaleTimeString(), text: "System initialized. Secure connection established to remote proxy.", type: 'info' },
        { time: new Date().toLocaleTimeString(), text: "Awaiting target selection...", type: 'warning' }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const res = await apiFetch("/devices");
                setDevices(res.devices || []);
            } catch (error) {
                console.error("Failed to fetch devices", error);
            }
        };
        fetchDevices();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const handleSelectPC = (pc: any) => {
        setSelectedPC(pc);
        addLog(`Target locked: ${pc.pc_name || pc.system_id} [${pc.status.toUpperCase()}]`, 'success');
        addLog(`Initiating handshake with Node ${pc.system_id}...`, 'info');
        setTimeout(() => addLog("Handshake successful. Awaiting commands.", 'success'), 800);
    };

    const addLog = (text: string, type: 'info' | 'success' | 'warning' | 'error' | 'command' = 'info') => {
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text, type }]);
    };

    const executeCommand = (cmdName: string, successMsg: string, duration: number = 2000) => {
        if (!selectedPC) {
            toast.error("No target system selected");
            addLog("ERROR: Execution aborted. Provide target.", 'error');
            return;
        }

        if (selectedPC.status === 'offline') {
            toast.error("System is completely offline. Unable to reach RPC server.");
            addLog(`ERROR: Connection timed out to ${selectedPC.system_id}. System is OFFLINE.`, 'error');
            return;
        }

        addLog(`> EXEC: ${cmdName} --target=${selectedPC.system_id}`, 'command');
        const toastId = toast.loading(`Executing ${cmdName} on ${selectedPC.pc_name || selectedPC.system_id}...`);

        setTimeout(() => {
            addLog(`[SUCCESS] ${successMsg}`, 'success');
            toast.success("Command Executed Successfully", { id: toastId });
        }, duration);
    };

    const filteredDevices = devices.filter(d =>
        (d.pc_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.system_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.lab_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 min-h-[calc(100vh-2rem)] animate-in fade-in duration-700 bg-background text-foreground flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase text-white font-display flex items-center gap-3">
                        <Terminal className="text-primary w-8 h-8" />
                        Terminal Command <span className="text-primary">Center</span>
                    </h1>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mt-1">Remote Infrastructure Management Console</p>
                </div>
                <div className="flex bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">RPC Gateway Online</span>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 h-[70vh]">
                {/* Left Panel - Fleet Selection */}
                <Card className="w-full lg:w-1/3 flex flex-col bg-card/50 backdrop-blur-sm border-border">
                    <div className="p-4 border-b border-border bg-black/20">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                            <Input
                                placeholder="Locate System via ID or Name..."
                                className="pl-9 bg-background/50 border-white/10 text-xs font-bold uppercase tracking-wider"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <ScrollArea className="flex-1 p-2">
                        <div className="space-y-1">
                            {filteredDevices.map(pc => (
                                <div
                                    key={pc.system_id}
                                    onClick={() => handleSelectPC(pc)}
                                    className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all border ${selectedPC?.system_id === pc.system_id ? 'bg-primary/20 border-primary/50' : 'border-transparent hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <MonitorPlay className={`w-4 h-4 ${pc.status === 'online' ? 'text-emerald-400' : 'text-red-400'}`} />
                                        <div>
                                            <p className={`text-[11px] font-black uppercase ${selectedPC?.system_id === pc.system_id ? 'text-primary' : 'text-white/80'}`}>{pc.pc_name || 'System Node'}</p>
                                            <p className="text-[9px] font-mono text-white/40">{pc.lab_name} - {pc.city}</p>
                                        </div>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${pc.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500/50'}`} />
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>

                {/* Right Panel - Terminal & Actions */}
                <Card className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0A] border-white/10 shadow-2xl relative">
                    {/* Fake Window Controls */}
                    <div className="h-8 bg-[#1A1A1A] border-b border-white/5 flex items-center px-4 w-full shrink-0">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                        </div>
                        <div className="flex-1 text-center text-[10px] font-mono font-bold text-white/30 tracking-widest">root@lab-guardian:~</div>
                    </div>

                    {/* Terminal Window */}
                    <div className="flex-1 p-6 font-mono text-xs overflow-y-auto space-y-2 relative" ref={scrollRef}>
                        {/* Background Watermark */}
                        <Terminal className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 text-white/5 pointer-events-none" />

                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-4 leading-tight">
                                <span className="text-white/30 shrink-0">[{log.time}]</span>
                                <span className={`break-words ${log.type === 'command' ? 'text-primary font-bold' :
                                        log.type === 'success' ? 'text-emerald-400' :
                                            log.type === 'error' ? 'text-red-400 font-bold' :
                                                log.type === 'warning' ? 'text-amber-400' : 'text-white/70'
                                    }`}>
                                    {log.text}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Action Panel */}
                    <div className="p-4 bg-muted/40 border-t border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-[1px] flex-1 bg-white/10" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Execution Protocol</span>
                            <div className="h-[1px] flex-1 bg-white/10" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Button
                                onClick={() => executeCommand('sys.reboot --force', 'System restarted. Connection dropped temporarily.')}
                                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 shadow-none justify-start px-4 h-11 transition-all group"
                            >
                                <RotateCcw className="w-4 h-4 mr-3 group-hover:rotate-180 transition-transform duration-500" />
                                <span className="text-[10px] font-bold tracking-widest uppercase">Restart Node</span>
                            </Button>

                            <Button
                                onClick={() => executeCommand('sys.shutdown --halt', 'ACPI power state changed to S5. System halted.')}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 shadow-none justify-start px-4 h-11 transition-all group"
                            >
                                <Power className="w-4 h-4 mr-3 group-hover:scale-90 transition-transform" />
                                <span className="text-[10px] font-bold tracking-widest uppercase">Force Shutdown</span>
                            </Button>

                            <Button
                                onClick={() => executeCommand('pkg.deploy monitoring_agent_v2.msi', 'Deployment package transferred and installed silently.', 3500)}
                                className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 shadow-none justify-start px-4 h-11 transition-all group"
                            >
                                <DownloadCloud className="w-4 h-4 mr-3 group-hover:-translate-y-1 transition-transform" />
                                <span className="text-[10px] font-bold tracking-widest uppercase">Deploy Update</span>
                            </Button>

                            <Button
                                onClick={() => executeCommand('diag.run --deep_scan', 'Diagnostic complete. CPU: Nominal, Memory: Stable, Disk: 45% Free.', 4000)}
                                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-none justify-start px-4 h-11 transition-all group"
                            >
                                <ShieldAlert className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold tracking-widest uppercase">Run Diagnostic</span>
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
