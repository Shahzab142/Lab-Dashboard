import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Info, MapPin, Building2, Cpu, ShieldCheck, Activity, Trash2, Terminal } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PUNJAB_HIERARCHY } from "@/lib/locationHierarchy";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    system_id: z.string().min(3, "System ID required"),
    pc_name: z.string().min(2, "PC name required"),
    hardware_id: z.string().min(5, "Hardware ID required"),
    city: z.string().min(1, "Please select a district"),
    tehsil: z.string().min(1, "Please select a tehsil"),
    lab_name: z.string().min(1, "Please select a laboratory"),
});

interface AddDeviceDialogProps {
    defaultCity?: string;
    defaultTehsil?: string;
    defaultLab?: string;
    onSuccess?: () => void;
}

export function AddDeviceDialog({ defaultCity, defaultTehsil, defaultLab, onSuccess }: AddDeviceDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pendingDevices, setPendingDevices] = useState<Record<string, any>>({});
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!open) return;
        const fetchPending = async () => {
            try {
                const res = await apiFetch('/discovery/pending');
                setPendingDevices(res);
            } catch (e) { }
        };
        fetchPending();
        const interval = setInterval(fetchPending, 3000);
        return () => clearInterval(interval);
    }, [open]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            system_id: "",
            pc_name: "",
            hardware_id: "",
            city: defaultCity || "",
            tehsil: defaultTehsil || "",
            lab_name: defaultLab || "",
        },
    });

    // Districts from static hierarchy
    const districts = useMemo(() => Object.keys(PUNJAB_HIERARCHY).sort(), []);

    // Tehsils based on selected district
    const selectedCity = form.watch("city");
    const tehsils = useMemo(() => {
        if (!selectedCity || !PUNJAB_HIERARCHY[selectedCity]) return [];
        return Object.keys(PUNJAB_HIERARCHY[selectedCity]).sort();
    }, [selectedCity]);

    // Labs based on selected tehsil
    const selectedTehsil = form.watch("tehsil");
    const filteredLabs = useMemo(() => {
        if (!selectedCity || !selectedTehsil || !PUNJAB_HIERARCHY[selectedCity]?.[selectedTehsil]) return [];
        return [...PUNJAB_HIERARCHY[selectedCity][selectedTehsil]].sort();
    }, [selectedCity, selectedTehsil]);

    // Reset tehsil/lab when parent changes
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === "city") {
                form.setValue("tehsil", "");
                form.setValue("lab_name", "");
            } else if (name === "tehsil") {
                form.setValue("lab_name", "");
            }
        });
        return () => subscription.unsubscribe();
    }, [form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            // BACKEND REGISTRY: Using API ensures service-key permissions and robust logic
            // This handles Hardware ID reassignments (e.g. moving HWID from shajeel-pc to shahzaib-pc)
            await apiFetch('/devices', {
                method: 'POST',
                body: JSON.stringify(values)
            });

            toast.success("Identity Registry Protocol Complete", {
                description: "System details synchronized. You may now finalize deployment.",
                duration: 5000,
            });

            // Reset form to current values to mark it as not "dirty"
            form.reset(values);

            queryClient.invalidateQueries({ queryKey: ['lab-inventory'] });
            queryClient.invalidateQueries({ queryKey: ['city-labs'] });
            queryClient.invalidateQueries({ queryKey: ['devices-list'] });

            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error(error);
            toast.error("Registry Failure", {
                description: error.message || "Connection refused. Is the Backend Server running?"
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleRemoteDeploy(action: string) {
        const hwid = form.getValues("hardware_id");
        if (!hwid) {
            toast.error("Missing Hardware ID", { description: "Please link a PC before triggering remote actions." });
            return;
        }

        setLoading(true);
        const toastId = toast.loading(`Broadcasting ${action.toUpperCase()} to Target...`);
        try {
            const res = await apiFetch('/trigger', {
                method: 'POST',
                body: JSON.stringify({ hardware_id: hwid, action })
            });

            toast.success(`Remote Command Queued`, {
                description: `Command will execute on the target PC within 30-60 seconds.`,
                id: toastId
            });
        } catch (error: any) {
            toast.error(`Link Failed`, {
                description: error.message || "Cannot reach server signal bridge.",
                id: toastId
            });
        } finally {
            setLoading(false);
        }
    }


    async function handleDetectHardware() {
        try {
            const res = await apiFetch('/local-hwid');
            if (res.hardware_id) {
                form.setValue("hardware_id", res.hardware_id);
                toast.success("Identity Detected", { description: "Current PC's Hardware ID has been auto-filled." });
            }
        } catch (error) {
            toast.error("Discovery Failed", { description: "Cannot detect local identity. Is the server running locally?" });
        }
    }

    // Modern Scrollbar Styles
    const scrollbarStyles = "scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-6 rounded-lg h-9 text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95">
                    <PlusCircle size={14} />
                    Add New PC
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] bg-[#0A0714] border-white/5 text-white shadow-2xl overflow-hidden glass-card">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

                <DialogHeader className="relative z-10">
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-widest text-white flex items-center gap-3">
                        <Cpu className="text-emerald-500" size={24} />
                        SYSTEM CONFIGURATION
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="relative z-10">
                        <div className={cn("max-h-[75vh] overflow-y-auto pr-3 -mr-3 space-y-6 custom-scrollbar px-1 pt-6 pb-6", scrollbarStyles)}>
                            {/* System & Identity Section */}
                            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                <FormField
                                    control={form.control}
                                    name="system_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[9px] uppercase font-black text-emerald-500/70 tracking-widest flex items-center gap-2">
                                                <Info size={10} /> System ID
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. PC-001" {...field} className="bg-black/40 border-white/10 text-white uppercase h-10 focus:ring-emerald-500/30 transition-all font-mono" />
                                            </FormControl>
                                            <FormMessage className="text-[9px] text-red-400 font-medium" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="pc_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[9px] uppercase font-black text-emerald-500/70 tracking-widest">PC Friendly Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Master-Sab" {...field} className="bg-black/40 border-white/10 text-white h-10 focus:ring-emerald-500/30 transition-all" />
                                            </FormControl>
                                            <FormMessage className="text-[9px] text-red-400 font-medium" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Hardware ID & Discovery Section */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[9px] uppercase font-black text-emerald-500/70 tracking-widest flex items-center gap-2">
                                            <Activity size={10} /> Auto-Discovery Feed
                                        </label>
                                        <div className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[7px] text-emerald-500 uppercase font-bold">Scanning...</span>
                                        </div>
                                    </div>

                                    <Select
                                        onValueChange={(val) => {
                                            const pc = pendingDevices[val];
                                            form.setValue("hardware_id", val);
                                            if (pc.pc_name) form.setValue("pc_name", pc.pc_name);
                                            toast.info("Discovery Link Active", { description: `Linked with ${pc.pc_name || val}` });
                                        }}
                                    >
                                        <SelectTrigger className="bg-black/60 border-emerald-500/20 text-white h-10 hover:border-emerald-500/40 transition-all">
                                            <SelectValue placeholder={Object.keys(pendingDevices).length > 0 ? `${Object.keys(pendingDevices).length} PC(s) Waiting for Link` : "No new PCs detected yet..."} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#12101b] border-white/10 text-white">
                                            {Object.entries(pendingDevices).length === 0 ? (
                                                <div className="p-4 text-center text-xs text-white/30 italic">
                                                    Target PC par Agent run karein taakay woh yahan show ho sakay.
                                                </div>
                                            ) : (
                                                Object.entries(pendingDevices).map(([id, info]: [string, any]) => (
                                                    <SelectItem key={id} value={id} className="focus:bg-emerald-500/20 focus:text-white cursor-pointer py-3">
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="font-bold text-[11px] text-emerald-400">{info.pc_name}</div>
                                                            <div className="text-[8px] font-mono opacity-40">{id}</div>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="h-[1px] bg-white/5 w-full" />

                                <FormField
                                    control={form.control}
                                    name="hardware_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex justify-between items-center mb-1">
                                                <FormLabel className="text-[9px] uppercase font-black text-blue-400/70 tracking-widest flex items-center gap-2">
                                                    <Cpu size={10} /> Hardware Fingerprint
                                                </FormLabel>
                                                <Button
                                                    variant="ghost"
                                                    type="button"
                                                    onClick={handleDetectHardware}
                                                    className="h-5 text-[8px] uppercase font-bold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-2 gap-1"
                                                >
                                                    <Terminal size={10} /> Link This PC
                                                </Button>
                                            </div>
                                            <FormControl>
                                                <Input placeholder="Registry UUID / HWID..." {...field} className="bg-black/40 border-white/10 text-white font-mono h-11 focus:ring-blue-500/30 text-xs tracking-wider" />
                                            </FormControl>
                                            <FormMessage className="text-[9px] text-red-400" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Geo-Spatial Location Hierarchy */}
                            <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                                    <MapPin size={64} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[9px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-1">
                                                    <MapPin size={10} /> District
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 hover:border-emerald-500/30 transition-colors text-xs">
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-[#0F0A1E] border-white/10 text-white max-h-[300px] overflow-y-auto custom-scrollbar">
                                                        {districts.map(city => (
                                                            <SelectItem key={city} value={city} className="hover:bg-emerald-500/20 focus:bg-emerald-500/20 transition-colors rounded-lg mx-1 cursor-pointer text-xs">
                                                                {city}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[9px] text-red-400" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="tehsil"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[9px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-1">
                                                    <MapPin size={10} /> Tehsil
                                                </FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    disabled={!selectedCity}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 disabled:opacity-30 text-xs">
                                                            <SelectValue placeholder={selectedCity ? "Select" : "---"} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-[#0F0A1E] border-white/10 text-white max-h-[300px] overflow-y-auto custom-scrollbar">
                                                        {tehsils.map(tehsil => (
                                                            <SelectItem key={tehsil} value={tehsil} className="hover:bg-emerald-500/20 focus:bg-emerald-500/20 transition-colors rounded-lg mx-1 cursor-pointer text-xs">
                                                                {tehsil}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[9px] text-red-400" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="lab_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[9px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-1">
                                                <Building2 size={10} /> Deployment Target Lab
                                            </FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={!selectedTehsil}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="bg-black/40 border-white/10 text-white h-10 disabled:opacity-30 text-xs">
                                                        <SelectValue placeholder={selectedTehsil ? "Select Target Laboratory" : "Pending Hierarchy Selection..."} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-[#0F0A1E] border-white/10 text-white max-h-[300px] overflow-y-auto custom-scrollbar">
                                                    {filteredLabs.map(labName => (
                                                        <SelectItem key={labName} value={labName} className="text-[10px] leading-tight py-3 hover:bg-emerald-500/20 focus:bg-emerald-500/20 transition-all rounded-lg mx-1 cursor-pointer">
                                                            {labName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-[9px] text-red-400" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* PRIMARY SAVE BUTTON */}
                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.3em] h-12 mt-4 shadow-xl shadow-emerald-900/40 relative overflow-hidden group transition-all active:scale-[0.98]"
                                disabled={loading}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[wave-flow_1.5s_linear_infinite]" />
                                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "SAVE SYSTEM DETAILS"}
                            </Button>

                            {/* SERVICE & DEPLOYMENT SHORTCUTS */}
                            <div className="pt-6 border-t border-white/5 space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Terminal size={12} className="text-emerald-500" />
                                        Deployment Protocol
                                    </h4>
                                    <span className="text-[8px] font-bold text-emerald-500/40 uppercase">Action Center</span>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <Button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => handleRemoteDeploy("start")}
                                        className="flex-col h-14 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 text-white rounded-xl gap-1 transition-all group"
                                    >
                                        <Activity size={14} className="text-blue-500 group-hover:scale-110 transition-transform" />
                                        <span className="text-[8px] font-black uppercase tracking-tighter">Start Live</span>
                                    </Button>

                                    <Button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => handleRemoteDeploy("install")}
                                        className="flex-col h-14 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 text-white rounded-xl gap-1 transition-all group"
                                    >
                                        <ShieldCheck size={14} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                                        <span className="text-[8px] font-black uppercase tracking-tighter">Install Srv</span>
                                    </Button>

                                    <Button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => handleRemoteDeploy("uninstall")}
                                        className="flex-col h-14 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 text-white rounded-xl gap-1 transition-all group"
                                    >
                                        <Trash2 size={14} className="text-red-500 group-hover:scale-110 transition-transform" />
                                        <span className="text-[8px] font-black uppercase tracking-tighter">Remove Srv</span>
                                    </Button>
                                </div>
                            </div>

                            {/* FINAL DEPLOYMENT BUTTON */}
                            <Button
                                type="button"
                                onClick={() => {
                                    if (form.formState.isDirty) {
                                        toast.warning("Pending Changes", { description: "Please save details before finalizing." });
                                    } else {
                                        setOpen(false);
                                        toast.success("Deployment Active", { description: "PC is now linked with system registry." });
                                    }
                                }}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-[0.2em] h-10 shadow-lg border border-white/5 transition-all mt-2"
                            >
                                EXECUTE DEPLOYMENT
                            </Button>

                            <p className="text-[8px] text-center text-white/20 uppercase font-bold tracking-widest px-8">
                                Step 1: Save Details | Step 2: Install/Start Service | Step 3: Execute Deployment
                            </p>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
