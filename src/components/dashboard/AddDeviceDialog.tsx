import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
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
import { PlusCircle, Loader2, Cpu, Activity, Trash2, Terminal, Play, Save, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PUNJAB_HIERARCHY } from "@/lib/locationHierarchy";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    system_id: z.string().min(2, "Required"),
    pc_name: z.string().min(2, "Required"),
    hardware_id: z.string().min(5, "Required"),
    city: z.string().min(1, "Select district"),
    tehsil: z.string().min(1, "Select tehsil"),
    lab_name: z.string().min(1, "Select lab"),
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
    const [savedStatus, setSavedStatus] = useState(false);
    const [pendingDevices, setPendingDevices] = useState<Record<string, any>>({});
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!open) {
            setSavedStatus(false);
            return;
        }
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

    const districts = useMemo(() => Object.keys(PUNJAB_HIERARCHY).sort(), []);

    const selectedCity = form.watch("city");
    const tehsils = useMemo(() => {
        if (!selectedCity || !PUNJAB_HIERARCHY[selectedCity]) return [];
        return Object.keys(PUNJAB_HIERARCHY[selectedCity]).sort();
    }, [selectedCity]);

    const selectedTehsil = form.watch("tehsil");
    const filteredLabs = useMemo(() => {
        if (!selectedCity || !selectedTehsil || !PUNJAB_HIERARCHY[selectedCity]?.[selectedTehsil]) return [];
        return [...PUNJAB_HIERARCHY[selectedCity][selectedTehsil]].sort();
    }, [selectedCity, selectedTehsil]);

    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === "city") {
                form.setValue("tehsil", "");
                form.setValue("lab_name", "");
            } else if (name === "tehsil") {
                form.setValue("lab_name", "");
            }
            if (savedStatus) {
                setSavedStatus(false);
            }
        });
        return () => subscription.unsubscribe();
    }, [form, savedStatus]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            // 1. Register the device in database
            await apiFetch('/devices', {
                method: 'POST',
                body: JSON.stringify(values)
            });

            // 2. Automatically command the local agent to start live monitoring
            try {
                await apiFetch('/trigger', {
                    method: 'POST',
                    body: JSON.stringify({ hardware_id: values.hardware_id, action: "start" })
                });
                toast.success("System Saved & Monitoring Initiated!");
            } catch (err) {
                toast.success("System Saved Successfully!");
                console.error("Auto-start failed", err);
            }

            form.reset(values);
            setSavedStatus(true);

            queryClient.invalidateQueries({ queryKey: ['lab-inventory'] });
            queryClient.invalidateQueries({ queryKey: ['city-labs'] });
            queryClient.invalidateQueries({ queryKey: ['devices-list'] });

            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast.error("Error", { description: error.message });
        } finally {
            setLoading(false);
        }
    }

    async function handleRemoteDeploy(action: string) {
        const hwid = form.getValues("hardware_id");
        if (!hwid) {
            toast.error("No Hardware ID selected");
            return;
        }

        setLoading(true);
        const actionLabel = action === 'start' ? 'Start Live Monitoring' : action === 'install' ? 'Install Service' : 'Remove Service';

        try {
            await apiFetch('/trigger', {
                method: 'POST',
                body: JSON.stringify({ hardware_id: hwid, action })
            });
            toast.success(`${actionLabel} Commanded Successfully`);
        } catch (error: any) {
            toast.error(`Action Failed`, { description: error.message });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) setSavedStatus(false);
            setOpen(val);
        }}>
            <DialogTrigger asChild>
                <Button className="bg-[#10b981] hover:bg-[#059669] text-white gap-2 px-6 rounded-md h-9 text-xs font-semibold shadow-md transition-all">
                    <PlusCircle size={15} /> Add New PC
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-[750px] w-[95vw] p-0 bg-[#0F172A] border border-slate-700 text-slate-200 shadow-2xl rounded-xl overflow-hidden">
                <div className="flex flex-col md:flex-row h-auto min-h-[420px]">

                    {/* LEFT SIDE: BUTTONS */}
                    <div className="w-full md:w-[220px] bg-slate-900 border-r border-slate-800 p-5 flex flex-col items-center pt-8">
                        <Terminal size={24} className="text-blue-500 mb-2" />
                        <h2 className="text-sm font-bold text-white mb-6 uppercase">PC Controls</h2>

                        <div className="flex flex-col gap-3 w-full">
                            <Button
                                type="button"
                                disabled={loading}
                                onClick={() => handleRemoteDeploy("start")}
                                className={cn(
                                    "w-full justify-start text-xs font-semibold shadow-sm transition-all h-9 px-3",
                                    "bg-blue-600 hover:bg-blue-500 text-white"
                                )}
                            >
                                <Play size={14} className="mr-2" /> Start Live Monitoring
                            </Button>

                            <Button
                                type="button"
                                disabled={loading}
                                onClick={() => handleRemoteDeploy("install")}
                                className={cn(
                                    "w-full justify-start text-xs font-semibold shadow-sm transition-all h-9 px-3",
                                    "bg-blue-600 hover:bg-blue-500 text-white"
                                )}
                            >
                                <Cpu size={14} className="mr-2" /> Install Service
                            </Button>

                            <div className="h-4"></div>

                            <Button
                                type="button"
                                disabled={loading}
                                onClick={() => handleRemoteDeploy("uninstall")}
                                className="w-full justify-start text-xs font-semibold h-9 px-3 bg-red-600 text-white hover:bg-red-500 transition-all shadow-sm"
                            >
                                <Trash2 size={14} className="mr-2" /> Remove Service
                            </Button>
                        </div>


                    </div>

                    {/* RIGHT SIDE: FORM */}
                    <div className="flex-1 p-6 flex flex-col bg-[#1E293B]">
                        <div className="mb-5">
                            <h3 className="text-xl font-bold text-white">Add New Lab PC</h3>
                            <p className="text-xs text-slate-400 mt-1">Select the PC from the discovery list and fill its details.</p>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 flex-1">

                                {/* DISCOVERY SELECTION */}
                                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                                            <Activity size={14} /> Step 1: Discover Local PC
                                        </label>
                                        <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-slate-900 text-emerald-500 shadow-inner">Auto-Scanning</span>
                                    </div>
                                    <Select
                                        onValueChange={(val) => {
                                            const pc = pendingDevices[val];
                                            form.setValue("hardware_id", val);
                                            if (pc.pc_name) form.setValue("pc_name", pc.pc_name);
                                        }}
                                    >
                                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9 w-full text-xs">
                                            <SelectValue placeholder={Object.keys(pendingDevices).length > 0 ? `🟢 ${Object.keys(pendingDevices).length} PC(s) Detected - Click to select` : "No PCs detected yet. Make sure agent is running."} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                            {Object.entries(pendingDevices).length === 0 ? (
                                                <div className="p-3 text-center text-xs text-slate-500 italic">No devices found.</div>
                                            ) : (
                                                Object.entries(pendingDevices).map(([id, info]: [string, any]) => (
                                                    <SelectItem key={id} value={id} className="text-xs focus:bg-slate-800 focus:text-emerald-400 cursor-pointer">
                                                        {info.pc_name} <span className="text-slate-500 ml-2 font-mono">({id})</span>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* PC INFO */}
                                <div className="grid grid-cols-3 gap-3">
                                    <FormField name="system_id" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[11px] text-slate-300">System ID</FormLabel>
                                            <FormControl><Input autoComplete="off" placeholder="E.g. PC-01" {...field} className="h-9 bg-slate-900 border-slate-700 text-xs text-white" /></FormControl>
                                            <FormMessage className="text-[9px]" />
                                        </FormItem>
                                    )} />
                                    <FormField name="pc_name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[11px] text-slate-300">PC Name</FormLabel>
                                            <FormControl><Input autoComplete="off" placeholder="E.g. Windows 10" {...field} className="h-9 bg-slate-900 border-slate-700 text-xs text-white" /></FormControl>
                                            <FormMessage className="text-[9px]" />
                                        </FormItem>
                                    )} />
                                    <FormField name="hardware_id" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[11px] text-slate-300">Hardware ID</FormLabel>
                                            <FormControl><Input autoComplete="off" placeholder="Auto-filled UUID" {...field} className="h-9 bg-slate-900 border-slate-700 text-xs font-mono text-emerald-400" /></FormControl>
                                            <FormMessage className="text-[9px]" />
                                        </FormItem>
                                    )} />
                                </div>

                                {/* LOCATION INFO */}
                                <div className="grid grid-cols-3 gap-3">
                                    <FormField name="city" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[11px] text-slate-300">District</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9 text-xs">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-[200px]">
                                                    {districts.map(city => <SelectItem key={city} value={city} className="text-xs">{city}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-[9px]" />
                                        </FormItem>
                                    )} />
                                    <FormField name="tehsil" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[11px] text-slate-300">Tehsil</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCity}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9 text-xs">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-[200px]">
                                                    {tehsils.map(te => <SelectItem key={te} value={te} className="text-xs">{te}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-[9px]" />
                                        </FormItem>
                                    )} />
                                    <FormField name="lab_name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[11px] text-slate-300">Target Lab</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedTehsil}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9 text-xs">
                                                        <SelectValue placeholder="Select Lab" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-[200px]">
                                                    {filteredLabs.map(lab => <SelectItem key={lab} value={lab} className="text-xs max-w-[300px]">{lab}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-[9px]" />
                                        </FormItem>
                                    )} />
                                </div>

                                {/* SAVE BUTTON */}
                                <div className="mt-auto pt-4">
                                    <Button
                                        type="submit"
                                        disabled={loading || savedStatus}
                                        className={cn(
                                            "w-full h-11 text-sm font-bold transition-all shadow-md",
                                            savedStatus
                                                ? "bg-emerald-900 text-emerald-300 border border-emerald-500/50 cursor-default"
                                                : "bg-[#10b981] hover:bg-[#059669] text-white"
                                        )}
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : savedStatus ? "✔ Step 2: Information Saved" : "Step 2: Save Information"}
                                    </Button>
                                </div>

                            </form>
                        </Form>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
