import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Building2, Search, MoreVertical, Edit2, Trash2, Upload, RotateCcw, CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';
import { useLabSchedule } from '@/hooks/useLabSchedule';
import { normalize, type ScheduleMap } from '@/lib/scheduleUtils';
import * as XLSX from 'xlsx';

export default function LabsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const city = searchParams.get('city');
    const tehsil = searchParams.get('tehsil');
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const schedule = useLabSchedule();

    // ─── Excel Upload Handler ───────────────────────────────────────────────
    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

                const newMap: ScheduleMap = { ...schedule.getScheduleMap() };
                let imported = 0;

                // Skip header row (row index 0)
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.length < 4) continue;

                    const districtRaw = String(row[0] || '').trim();
                    const tehsilRaw = String(row[1] || '').trim();
                    const labNameRaw = String(row[2] || '').trim();
                    const scheduleRaw = String(row[3] || '').trim();

                    if (!districtRaw || !labNameRaw || !scheduleRaw) continue;

                    // Parse days: "Monday, Friday" → ["Monday", "Friday"]
                    const days = scheduleRaw
                        .split(/[,;/]+/)
                        .map(d => d.trim())
                        .filter(d => d.length > 2);

                    if (days.length === 0) continue;

                    const key = schedule.makeLabKey(districtRaw, tehsilRaw, labNameRaw);
                    newMap[key] = days;
                    imported++;
                }

                if (imported === 0) {
                    toast.error('No valid rows found. Check the Excel format: District | Tehsil | Lab Name | Schedule');
                    return;
                }

                schedule.applySchedule(newMap);
                toast.success(`📅 Schedule applied for ${imported} lab(s). History now filtered by scheduled days.`);
            } catch (err) {
                console.error(err);
                toast.error('Failed to parse Excel file. Ensure it is a valid .xlsx or .xls file.');
            }
        };
        reader.readAsArrayBuffer(file);

        // Reset input so the same file can be re-uploaded
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ─── Lab Actions ────────────────────────────────────────────────────────
    const handleRenameLab = async (e: React.MouseEvent, oldName: string) => {
        e.stopPropagation();
        const newName = prompt("Enter new name for lab:", oldName);
        if (!newName || newName === oldName) return;
        try {
            await apiFetch('/stats/lab/rename', {
                method: 'PATCH',
                body: JSON.stringify({ city, old_name: oldName, new_name: newName })
            });
            toast.success(`Lab renamed to ${newName}`);
            queryClient.invalidateQueries({ queryKey: ['all-devices-for-labs'] });
        } catch (err) {
            toast.error("Failed to rename lab");
        }
    };

    const handleDeleteLab = async (e: React.MouseEvent, labName: string) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete ${labName}?`)) return;
        try {
            await apiFetch(`/stats/lab/delete?city=${encodeURIComponent(city || '')}&lab=${encodeURIComponent(labName)}`, { method: 'DELETE' });
            toast.success(`${labName} deleted.`);
            queryClient.invalidateQueries({ queryKey: ['all-devices-for-labs'] });
        } catch (err) {
            toast.error("Failed to delete lab");
        }
    };

    // ─── Data Fetching ───────────────────────────────────────────────────────
    const { data: statsData, isLoading } = useQuery({
        queryKey: ['global-lab-stats'],
        queryFn: () => apiFetch("/stats/labs/all"),
        refetchInterval: 10000,
    });

    const labs = useMemo(() => {
        const allLabs = Array.isArray(statsData?.labs) ? statsData.labs : [];
        let filtered = allLabs;

        if (city) {
            const targetCity = city.trim().toUpperCase();
            filtered = filtered.filter((l: any) =>
                (l.norm_city === targetCity) || (l.city?.toUpperCase() === targetCity)
            );
        }
        if (tehsil) {
            const targetTehsil = tehsil.trim().toUpperCase();
            filtered = filtered.filter((l: any) =>
                (l.norm_tehsil === targetTehsil) || (l.tehsil?.toUpperCase() === targetTehsil)
            );
        }
        return filtered;
    }, [statsData, city, tehsil]);

    const status = searchParams.get('status');
    const auditStatus = searchParams.get('audit');

    const { data: allDevices } = useQuery({
        queryKey: ['all-devices-for-audit'],
        queryFn: async () => {
            const { data, error } = await supabase.from('devices').select('*');
            if (error) throw error;
            return data;
        },
        refetchInterval: 15000
    });

    const filteredLabs = useMemo(() => {
        if (!labs || !allDevices) return [];

        const now = new Date();
        const IDLE_TIME_WINDOW = 60 * 60 * 1000;
        const CPU_ACTIVITY_THRESHOLD = 12;

        const uniqueLabsMap = new Map();
        labs.forEach((l: any) => {
            const key = `${(l.city || l.norm_city || '').toUpperCase().trim()}-${(l.tehsil || l.norm_tehsil || '').toUpperCase().trim()}-${(l.lab_name || l.lab || '').toUpperCase().trim()}`;
            if (!uniqueLabsMap.has(key)) uniqueLabsMap.set(key, l);
        });
        const uniqueLabs = Array.from(uniqueLabsMap.values());

        return uniqueLabs.filter((lab: any) => {
            const labName = (lab.lab_name || lab.lab || '').toUpperCase().trim();
            const labCity = (lab.city || lab.norm_city || '').toUpperCase().trim();
            const labTehsil = (lab.tehsil || lab.norm_tehsil || '').toUpperCase().trim();

            const matchesSearch = labName.includes(searchTerm.toUpperCase().trim());

            const labDevices = allDevices.filter(d =>
                (d.lab_name || '').toUpperCase().trim() === labName &&
                (d.city || '').toUpperCase().trim() === labCity &&
                (d.tehsil || '').toUpperCase().trim() === labTehsil
            );

            const onlinePCs = labDevices.filter(d => {
                const lastSeen = d.last_seen ? new Date(d.last_seen) : null;
                return d.status === 'online' && lastSeen && (now.getTime() - lastSeen.getTime() < IDLE_TIME_WINDOW);
            });

            const onlineCount = onlinePCs.length;
            const avgCpu = onlineCount > 0
                ? onlinePCs.reduce((acc, pc) => acc + (pc.cpu_score || 0), 0) / onlineCount
                : 0;

            const maxLastSeen = labDevices.reduce((max, d) => {
                const dTime = d.last_seen ? new Date(d.last_seen).getTime() : 0;
                return Math.max(max, dTime);
            }, 0);
            const daysOffline = maxLastSeen === 0 ? 999 : (now.getTime() - maxLastSeen) / (1000 * 3600 * 24);

            let matchesFilter = true;

            if (status === 'online') {
                matchesFilter = onlineCount > 0;
            } else if (status === 'offline') {
                matchesFilter = onlineCount === 0 && daysOffline <= 7;
            } else if (status === 'offline_7d') {
                matchesFilter = onlineCount === 0 && daysOffline > 7 && daysOffline <= 30;
            } else if (status === 'offline_30d') {
                matchesFilter = onlineCount === 0 && daysOffline > 30;
            } else if (status === 'all_offline') {
                matchesFilter = onlineCount === 0;
            } else if (auditStatus === 'used') {
                const hasSignificantActivity = onlinePCs.some(pc => (pc.cpu_score || 0) > CPU_ACTIVITY_THRESHOLD);
                matchesFilter = onlineCount > 0 && (hasSignificantActivity || avgCpu > 10);
            } else if (auditStatus === 'idle') {
                const hasSignificantActivity = onlinePCs.some(pc => (pc.cpu_score || 0) > CPU_ACTIVITY_THRESHOLD);
                matchesFilter = onlineCount > 0 && !(hasSignificantActivity || avgCpu > 10);
            }

            return matchesSearch && matchesFilter;
        }).sort((a: any, b: any) => (b.total_pcs || 0) - (a.total_pcs || 0));
    }, [labs, allDevices, searchTerm, status, auditStatus]);

    const maxSystemsInLab = useMemo(() => {
        if (!filteredLabs || filteredLabs.length === 0) return 20;
        return Math.max(...filteredLabs.map((l: any) => l.total_pcs || 0), 10);
    }, [filteredLabs]);

    const hasSchedule = schedule.hasAnySchedule();

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-right-4 duration-700 bg-background min-h-screen font-sans select-none">
            <header className="pb-6 border-b border-border space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 rounded-lg bg-card border border-border text-[9px] font-bold uppercase tracking-widest text-white/70 hover:text-primary hover:border-primary transition-all font-display"
                            onClick={() => navigate(tehsil ? `/dashboard/tehsils?city=${city}` : city ? '/dashboard/cities' : '/dashboard')}
                        >
                            <ArrowLeft className="w-3 h-3 mr-2" /> {tehsil ? 'Back to Tehsils' : city ? 'Back to Districts' : 'Back to Dashboard'}
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight uppercase text-white font-display leading-tight">
                                {tehsil ? `${tehsil.toUpperCase()} LABS` :
                                    city ? `${city.toUpperCase()} SYSTEM` :
                                        auditStatus === 'used' ? 'OPERATIONAL LABS' :
                                            auditStatus === 'idle' ? 'IDLE LABS (AUDIT ALERT)' :
                                                status === 'offline_7d' ? 'RECENTLY OFFLINE (7D+)' :
                                                    status === 'offline_30d' ? 'LONG-TERM OFFLINE (30D+)' :
                                                        status === 'all_offline' ? 'ALL OFFLINE LABS' :
                                                            status ? `${status.toUpperCase()} LABS` : 'LABWISE SYSTEM'}
                            </h1>
                            <p className="text-white/40 font-bold uppercase tracking-wider text-[9px] mt-1">
                                {tehsil ? `Facilities within ${tehsil} tehsil` : city ? 'Regional Lab Clusters & Facility Inventory' : 'Bulk Facility Inventory & Management'}
                            </p>
                        </div>
                    </div>

                    {city && (
                        <Button
                            onClick={async () => {
                                const toastId = toast.loading(`Synthesizing ${city} infrastructure audit...`);
                                try {
                                    const { generateDynamicReport } = await import('@/lib/pdf-generator');
                                    await generateDynamicReport('CITY', { labs, city }, city!);
                                    toast.success("PowerPoint Report Generated", { id: toastId });
                                } catch (e) {
                                    console.error(e);
                                    toast.error("Failed to generate audit", { id: toastId });
                                }
                            }}
                            className="bg-white hover:bg-white/90 text-black gap-2 px-6 rounded-lg h-10 text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm shrink-0"
                        >
                            <Building2 size={16} className="text-black" />
                            Generate City Audit (PPTX)
                        </Button>
                    )}
                </div>

                {/* ─── Controls Row: Upload + Reset + Search ─── */}
                <div className="flex flex-col md:flex-row items-center gap-3 pt-2">

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={handleExcelUpload}
                    />

                    {/* Upload Schedule Button */}
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="h-11 px-5 rounded-lg bg-secondary/10 border border-secondary/30 text-secondary hover:bg-secondary hover:text-black text-[10px] font-bold uppercase tracking-widest gap-2 transition-all shrink-0"
                        variant="ghost"
                    >
                        <Upload size={14} />
                        Upload Schedule
                    </Button>

                    {/* Global Reset Button — only shown when schedule exists */}
                    {hasSchedule && (
                        <Button
                            onClick={() => {
                                schedule.resetAll();
                                toast.success('All lab schedules cleared. Showing full history.');
                            }}
                            className="h-11 px-5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white text-[10px] font-bold uppercase tracking-widest gap-2 transition-all shrink-0"
                            variant="ghost"
                        >
                            <RotateCcw size={14} />
                            Reset All Schedules
                        </Button>
                    )}

                    {/* Active schedule indicator */}
                    {hasSchedule && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                            <CalendarDays size={12} className="text-primary" />
                            <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Schedule Active</span>
                        </div>
                    )}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Search */}
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-all" />
                        <Input
                            placeholder="SEARCH BY LAB NAME OR CITY..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 bg-card border-border focus:ring-1 focus:ring-primary text-[10px] font-bold uppercase tracking-wider h-11 rounded-lg transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* ─── Excel Format Hint (shown when upload area is focused) ─── */}
                {hasSchedule && (
                    <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest">
                        📅 History filtered by Excel schedule &nbsp;•&nbsp; Format: District | Tehsil | Lab Name | Schedule (e.g. Monday, Friday)
                    </div>
                )}
            </header >

            {
                isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" >
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl bg-card" />)
                        }
                    </div >
                ) : filteredLabs.length === 0 ? (
                    <div className="p-20 text-center bg-card border border-dashed border-border rounded-2xl shadow-sm">
                        <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-20" />
                        <h3 className="text-xl font-bold text-primary uppercase tracking-tight">No Access Points Detected</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredLabs.map((lab: any, index: number) => {
                            const total = lab.total_pcs || 0;
                            const online = lab.online || 0;
                            const labCityVal = lab.city || lab.norm_city || '';
                            const labTehsilVal = lab.tehsil || lab.norm_tehsil || '';
                            const labNameVal = lab.lab_name || lab.lab || '';

                            const scheduleLabel = schedule.getScheduleLabel(labCityVal, labTehsilVal, labNameVal);

                            const gaugeData = [
                                { name: 'Systems', value: total },
                                { name: 'Remaining', value: Math.max(0, maxSystemsInLab - total) }
                            ];

                            return (
                                <Card
                                    key={`${lab.city || 'no-city'}-${lab.tehsil || 'no-tehsil'}-${lab.lab_name || lab.lab}-${index}`}
                                    onClick={() => navigate(`/dashboard/devices?city=${encodeURIComponent(city || lab.city || '')}&tehsil=${encodeURIComponent(tehsil || lab.tehsil || '')}&lab=${encodeURIComponent(lab.lab_name || lab.lab)}`)}
                                    className="group relative overflow-hidden bg-card cursor-pointer border border-border hover:border-primary/40 transition-all hover:translate-y-[-4px] shadow-sm hover:shadow-lg rounded-2xl min-h-[200px] flex flex-col"
                                >
                                    <CardContent className="p-5 flex flex-col justify-between flex-1 gap-2">
                                        {/* Name & Control */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2 rounded-lg bg-primary text-black shrink-0 shadow-sm transition-transform group-hover:scale-110">
                                                    <Building2 size={14} />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <h2 className="text-sm font-bold tracking-tight uppercase text-white group-hover:text-white/80 transition-colors truncate font-display">
                                                        {labNameVal}
                                                    </h2>
                                                    {/* Schedule badge */}
                                                    {scheduleLabel && (
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <CalendarDays size={9} className="text-primary/60" />
                                                            <span className="text-[8px] font-bold text-primary/60 uppercase tracking-widest">{scheduleLabel}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <button className="p-1.5 hover:bg-white/5 rounded transition-colors text-white/20 shrink-0">
                                                        <MoreVertical size={14} />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-card border border-border rounded-xl p-1.5 shadow-2xl backdrop-blur-xl">
                                                    <DropdownMenuItem onClick={(e) => handleRenameLab(e, labNameVal)} className="gap-2 text-[10px] font-bold uppercase p-2.5 rounded-lg transition-all focus:bg-primary focus:text-black">
                                                        <Edit2 size={12} className="text-primary group-focus:text-black" /> Rename
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => handleDeleteLab(e, labNameVal)} className="gap-2 text-red-500 text-[10px] font-bold uppercase p-2.5 rounded-lg transition-all focus:bg-red-500 focus:text-white">
                                                        <Trash2 size={12} /> Delete
                                                    </DropdownMenuItem>
                                                    {/* Per-lab schedule reset */}
                                                    {scheduleLabel && (
                                                        <>
                                                            <DropdownMenuSeparator className="bg-border my-1" />
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    schedule.resetLab(labCityVal, labTehsilVal, labNameVal);
                                                                    toast.success(`Schedule cleared for ${labNameVal}`);
                                                                }}
                                                                className="gap-2 text-amber-400 text-[10px] font-bold uppercase p-2.5 rounded-lg transition-all focus:bg-amber-500 focus:text-black"
                                                            >
                                                                <RotateCcw size={12} /> Reset Lab Schedule
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Gauge Section */}
                                        <div className="flex-1 flex flex-col items-center justify-end relative h-24 my-2">
                                            <div className="h-24 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart width={100} height={100}>
                                                        <defs>
                                                            <linearGradient id="gaugeGradientLab" x1="0" y1="0" x2="1" y2="0">
                                                                <stop offset="0%" stopColor="#f99a1d" stopOpacity={0.6} />
                                                                <stop offset="100%" stopColor="#f99a1d" stopOpacity={1} />
                                                            </linearGradient>
                                                        </defs>
                                                        <Pie
                                                            data={gaugeData}
                                                            cx="50%"
                                                            cy="100%"
                                                            startAngle={180}
                                                            endAngle={0}
                                                            innerRadius={45}
                                                            outerRadius={60}
                                                            paddingAngle={0}
                                                            dataKey="value"
                                                            stroke="none"
                                                        >
                                                            <Cell fill="url(#gaugeGradientLab)" className="drop-shadow-[0_0_8px_rgba(249,154,29,0.3)]" />
                                                            <Cell fill="rgba(255, 255, 255, 0.03)" />
                                                        </Pie>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                                                <div className="text-2xl font-black text-white leading-none">
                                                    {total}
                                                </div>
                                                <div className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] mt-0.5">
                                                    TOTAL PCS
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end border-t border-white/5 pt-3 mt-1">
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-400/5 border border-emerald-400/10 group-hover:bg-emerald-400/10 transition-all">
                                                <div className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]" />
                                                <span className="text-lg font-bold text-emerald-400 tracking-tight leading-none">{online}</span>
                                                <span className="text-[8px] font-black text-emerald-400/40 uppercase tracking-widest">LIVE</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )
            }
        </div >
    );
}
