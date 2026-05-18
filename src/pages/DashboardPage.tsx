/**
 * ----------------------------------------------------------------------------------
 * @file DashboardPage.tsx
 * @description In-depth analytical dashboard displaying aggregated metrics across all managed PCs.
 *
 * @architecture
 * - Fetches telemetry from `/stats/labs/all`.
 * - Groups and pivots data across multiple dimensions (City -> Tehsil -> Lab -> PC).
 * - Implements complex data visualizations (Recharts) to show bandwidth, uptime, and app usage.
 * - Performance optimized using `useMemo` hooks to prevent recalculation of heavily aggregated data.
 * ----------------------------------------------------------------------------------
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

import { PieChart, Pie, Cell, ResponsiveContainer, Sector, Tooltip } from "recharts";
import { Loader2, Search, X, MapPin, Building2, Layout, Landmark, Activity, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRef, useEffect, useCallback } from "react";

const COLORS = [
    "#f99a1d", // Golden Amber
    "#8B5CF6", // Electric Indigo
    "#06B6D4", // Vibrant Cyan
    "#EC4899", // Hot Pink
    "#3B82F6", // Royal Blue
    "#10B981", // Emerald Green
    "#F43F5E", // Rose Red
    "#84CC16", // Lime Green
    "#A855F7", // Bright Purple
    "#0EA5E9", // Sky Blue
];

const getStableColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
};

interface Lab {
    city: string;
    tehsil: string;
    lab_name: string;
    online?: string | number;
    total_pcs?: string | number;
}

interface ChartEntry {
    name: string;
    value: number;
    color: string;
    fullData?: Lab;
    tehsilsCount?: number;
    labsCount?: number;
    onlinePCs?: number;
    totalPCs?: number;
    activeRatio?: number;
    healthStatus?: 'healthy' | 'warning' | 'critical';
}

interface SearchSuggestion {
    type: 'district' | 'tehsil' | 'lab';
    name: string;
    district: string;
    tehsil?: string;
}

const ActiveDetailCard = ({ data, viewMode, activeFilter }: { data: ChartEntry | null, viewMode: string, activeFilter: SearchSuggestion | null }) => {
    if (!data) return null;

    let label = "Units";
    let subLabel = "";
    let description = "";

    // Global View Modes
    if (!activeFilter) {
        if (viewMode === 'district') {
            label = "Tehsils";
            description = "Sub-administrative divisions";
        }
        else if (viewMode === 'tehsil') {
            label = "Labs";
            description = "Active monitoring sites";
        }
        else if (viewMode === 'labs') {
            label = "Labs";
            description = `Labs with ${data.name} status`;
        }
        else if (viewMode === 'pc') {
            label = "PCs";
            description = `Units with ${data.name} status`;
        }
    } else {
        // Filtered (Drill-down) Modes
        if (activeFilter.type === 'district') {
            label = "Labs";
            subLabel = `in ${data.name}`;
            description = "Labs in this tehsil";
        } else if (activeFilter.type === 'tehsil') {
            label = "PCs";
            subLabel = `in ${data.name}`;
            description = "Total deployed hardware";
        } else if (activeFilter.type === 'lab') {
            label = "PCs";
            subLabel = `${data.name}`;
            description = "Hardware status breakdown";
        }
    }

    const accentColor = data.color.startsWith('url') ? (data.name === 'Online' ? '#10B981' : '#f43f5e') : data.color;

    return (
        <div
            className="w-[220px] shrink-0 p-[2px] rounded-3xl bg-gradient-to-br from-white/15 to-transparent border border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.85)] animate-in fade-in zoom-in-95 duration-500 pointer-events-none"
        >
            <div className="bg-[#0b0c1e] rounded-[1.4rem] p-5 h-full relative overflow-hidden group">
                {/* Decorative glow */}
                <div 
                    className="absolute -top-10 -right-10 w-28 h-28 blur-[40px] rounded-full opacity-40 transition-opacity"
                    style={{ backgroundColor: accentColor }}
                />
                
                <div className="relative z-10 flex flex-col gap-5">
                    {/* Header: Segment Name & Indicator */}
                    <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                        <div
                            className="w-3 h-3 rounded-full shadow-[0_0_15px_currentcolor]"
                            style={{ color: accentColor, backgroundColor: accentColor }}
                        />
                        <span className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] truncate">
                            {data.name}
                        </span>
                    </div>

                    {/* Numeric Value section */}
                    <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                            <p className="text-5xl font-black text-white leading-none tracking-tighter italic" 
                               style={{ filter: `drop-shadow(0 0 15px ${accentColor}30)` }}>
                                {data.value}
                            </p>
                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{label}</span>
                        </div>
                        {subLabel && (
                            <p className="text-[9px] font-bold text-primary uppercase tracking-[0.15em] opacity-80 truncate">
                                {subLabel}
                            </p>
                        )}
                    </div>

                    {/* Highly Premium Merged Stats Section */}
                    {(data.tehsilsCount !== undefined || data.labsCount !== undefined || data.onlinePCs !== undefined || data.activeRatio !== undefined || data.healthStatus) && (
                        <div className="flex flex-col gap-2 pt-3 mt-1 border-t border-white/5 text-[10px]">
                            {data.tehsilsCount !== undefined && (
                                <div className="flex justify-between items-center py-0.5">
                                    <span className="text-white/40 font-bold uppercase tracking-wider text-[8px]">Tehsils</span>
                                    <span className="text-white font-black">{data.tehsilsCount}</span>
                                </div>
                            )}
                            {data.labsCount !== undefined && (
                                <div className="flex justify-between items-center py-0.5">
                                    <span className="text-white/40 font-bold uppercase tracking-wider text-[8px]">Total Labs</span>
                                    <span className="text-white font-black">{data.labsCount}</span>
                                </div>
                            )}
                            {data.onlinePCs !== undefined && data.totalPCs !== undefined && (
                                <div className="flex flex-col gap-1 py-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/40 font-bold uppercase tracking-wider text-[8px]">PCs Online</span>
                                        <span className="text-white font-black">{data.onlinePCs} / {data.totalPCs}</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-0.5">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-full" 
                                            style={{ width: `${Math.min(100, (data.onlinePCs / Math.max(1, data.totalPCs)) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            {data.activeRatio !== undefined && (
                                <div className="flex justify-between items-center py-0.5">
                                    <span className="text-white/40 font-bold uppercase tracking-wider text-[8px]">Active Ratio</span>
                                    <span className="text-emerald-400 font-black">{data.activeRatio}%</span>
                                </div>
                            )}
                            {data.healthStatus && (
                                <div className="flex justify-between items-center pt-1 mt-1 border-t border-white/5">
                                    <span className="text-white/40 font-bold uppercase tracking-wider text-[8px]">Node Status</span>
                                    <div className="flex items-center gap-1.5">
                                        {data.healthStatus === 'healthy' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                                        {data.healthStatus === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                                        {data.healthStatus === 'critical' && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                                        <span className={cn(
                                            "font-black uppercase text-[8px] tracking-widest",
                                            data.healthStatus === 'healthy' ? "text-emerald-400" :
                                            data.healthStatus === 'warning' ? "text-amber-400" : "text-rose-400"
                                        )}>
                                            {data.healthStatus}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bottom Subtext */}
                    <div className="pt-3 border-t border-white/5">
                        <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

    return (
        <g>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 6}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                className="transition-all duration-300"
                style={{ filter: `drop-shadow(0px 0px 15px ${fill}90)` }}
            />
        </g>
    );
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload as ChartEntry;
        
        return (
            <div className="bg-[#0f1428] border border-white/10 rounded-[14px] p-4 shadow-[0_15px_40px_rgba(0,0,0,0.8)] pointer-events-none z-50 min-w-[220px]"
                 style={{ borderColor: `${data.color}50`, boxShadow: `0 0 20px ${data.color}20` }}>
                <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color, boxShadow: `0 0 10px ${data.color}` }} />
                    <span className="text-white font-bold tracking-wider uppercase text-sm">{data.name}</span>
                </div>
                
                <div className="space-y-1.5 text-xs">
                    {data.tehsilsCount !== undefined && (
                        <div className="flex justify-between text-white/70">
                            <span>Tehsils:</span> <span className="text-white font-medium">{data.tehsilsCount}</span>
                        </div>
                    )}
                    {data.labsCount !== undefined && (
                        <div className="flex justify-between text-white/70">
                            <span>Labs:</span> <span className="text-white font-medium">{data.labsCount}</span>
                        </div>
                    )}
                    {data.onlinePCs !== undefined && data.totalPCs !== undefined && (
                        <div className="flex justify-between text-white/70">
                            <span>PCs Online:</span> <span className="text-white font-medium">{data.onlinePCs} / {data.totalPCs}</span>
                        </div>
                    )}
                    {data.activeRatio !== undefined && (
                        <div className="flex justify-between text-white/70">
                            <span>Active Ratio:</span> <span className="text-white font-medium">{data.activeRatio}%</span>
                        </div>
                    )}
                    
                    {data.healthStatus && (
                        <div className="mt-3 pt-2 border-t border-white/5">
                            <div className="flex items-center gap-1.5">
                                {data.healthStatus === 'healthy' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                                {data.healthStatus === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                                {data.healthStatus === 'critical' && <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                                <span className={cn(
                                    "font-bold uppercase text-[10px] tracking-widest",
                                    data.healthStatus === 'healthy' ? "text-emerald-500" :
                                    data.healthStatus === 'warning' ? "text-amber-500" : "text-rose-500"
                                )}>
                                    {data.healthStatus} STATUS
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

export default function DashboardPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [hoveredData, setHoveredData] = useState<ChartEntry | null>(null);
    const [activeIndex, setActiveIndex] = useState<number | undefined>();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState<SearchSuggestion | null>(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["global-lab-stats"],
        queryFn: () => apiFetch("/stats/labs/all"),
        refetchInterval: 10000,
    });

    // Close search dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const labs: Lab[] = useMemo(() => {
        return (Array.isArray(data?.labs) ? data.labs : []).filter((l: unknown): l is Lab => !!l && typeof l === 'object' && 'city' in l);
    }, [data?.labs]);

    // --- SEARCH / SUGGESTIONS LOGIC ---
    const suggestions = useMemo<SearchSuggestion[]>((() => {
        if (!labs.length) return [];
        
        const districts = new Set<string>();
        const tehsils = new Map<string, string>(); // name -> city
        const labEntries = new Set<string>(); // lab_name|city|tehsil

        labs.forEach((l) => {
            if (l.city) districts.add(l.city);
            if (l.tehsil) tehsils.set(l.tehsil, l.city);
            if (l.lab_name) labEntries.add(`${l.lab_name}|${l.city}|${l.tehsil || ''}`);
        });

        const list: SearchSuggestion[] = [];
        districts.forEach(d => list.push({ type: 'district', name: d, district: d }));
        tehsils.forEach((city, name) => list.push({ type: 'tehsil', name, district: city }));
        labEntries.forEach(entry => {
            const [name, city, tehsil] = entry.split('|');
            list.push({ type: 'lab', name, district: city, tehsil });
        });

        return list;
    }), [labs]);

    const filteredSuggestions = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        return suggestions
            .filter(s => s.name.toLowerCase().includes(q))
            .slice(0, 10);
    }, [suggestions, searchQuery]);

    const handleSelectSuggestion = (s: SearchSuggestion) => {
        setSelectedFilter(s);
        setSearchQuery("");
        setIsSearchFocused(false);
    };

    const centerViewMode = (searchParams.get('centerView') as 'district' | 'tehsil' | 'labs' | 'pc') || 'district';

    const setCenterViewMode = (mode: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('centerView', mode);
        setSearchParams(newParams);
    };

    const totalPCs = useMemo(() => labs.reduce((acc, l) => acc + Number(l.total_pcs || 0), 0), [labs]);

    // --- DISTRIBUTION (Center/Right circle) ---
    const { statsMap, totalCities, totalTehsils, totalLabs } = useMemo(() => {
        const stats = new Map<string, { labCount: number, pcCount: number, onlinePcCount: number, tehsilSet: Set<string> }>();
        const tehsils = new Set<string>();
        const cities = new Map<string, boolean>();

        labs.forEach((l) => {
            const city = l.city || 'Unknown';
            const tehsil = l.tehsil || 'Unknown';
            tehsils.add(`${city}|${tehsil}`);
            cities.set(city, true);

            const groupKey = centerViewMode === 'tehsil' ? tehsil : city;
            const current = stats.get(groupKey) || { labCount: 0, pcCount: 0, onlinePcCount: 0, tehsilSet: new Set<string>() };
            current.tehsilSet.add(tehsil);
            stats.set(groupKey, {
                labCount: current.labCount + 1,
                pcCount: current.pcCount + Number(l.total_pcs || 0),
                onlinePcCount: current.onlinePcCount + Number(l.online || 0),
                tehsilSet: current.tehsilSet
            });
        });

        return {
            statsMap: stats,
            totalCities: cities.size,
            totalTehsils: tehsils.size,
            totalLabs: labs.length
        };
    }, [labs, centerViewMode]);

    const chartData = useMemo<ChartEntry[]>(() => {
        // --- DRILL-DOWN LOGIC (When a search filter is active) ---
        if (selectedFilter) {
            if (selectedFilter.type === 'district') {
                const tehsilMap = new Map<string, number>();
                labs.filter((l) => l.city === selectedFilter.name).forEach((l) => {
                    const t = l.tehsil || 'Unknown';
                    tehsilMap.set(t, (tehsilMap.get(t) || 0) + 1);
                });
                return Array.from(tehsilMap.entries()).map(([name, value]) => ({
                    name,
                    value,
                    color: getStableColor(name)
                }));
            }

            if (selectedFilter.type === 'tehsil') {
                const tehsilLabs = labs.filter((l) => l.tehsil === selectedFilter.name);
                return tehsilLabs.map((l) => {
                    const name = l.lab_name || 'Unknown Lab';
                    return {
                        name,
                        value: Number(l.total_pcs || 1),
                        color: getStableColor(name),
                        fullData: l
                    };
                });
            }

            if (selectedFilter.type === 'lab') {
                const targetLab = labs.find((l) => l.lab_name === selectedFilter.name);
                if (!targetLab) return [];
                const online = Number(targetLab.online || 0);
                const total = Number(targetLab.total_pcs || 1);
                const offline = Math.max(0, total - online);
                return [
                    { name: 'Online', value: online, color: '#00a629' },
                    { name: 'Offline', value: offline, color: '#7c3aed' }
                ].filter(d => d.value > 0);
            }
        }

        // --- GLOBAL VIEWS (Standard Dashboard behavior) ---
        if (centerViewMode === 'labs') {
            const onlineLabs = labs.filter((l) => Number(l.online || 0) > 0).length;
            const offlineLabs = labs.length - onlineLabs;
            return [
                { name: 'Online', value: onlineLabs, color: '#00a629' },
                { name: 'Offline', value: offlineLabs, color: '#7c3aed' }
            ].filter(d => d.value > 0);
        }

        if (centerViewMode === 'pc') {
            const onlinePCs = labs.reduce((acc, l) => acc + Number(l.online || 0), 0);
            const totalPCsVal = labs.reduce((acc, l) => acc + Number(l.total_pcs || 0), 0);
            const offlinePCs = totalPCsVal - onlinePCs;
            return [
                { name: 'Online', value: onlinePCs, color: '#00a629' },
                { name: 'Offline', value: offlinePCs, color: '#7c3aed' }
            ].filter(d => d.value > 0);
        }

        return Array.from(statsMap.entries()).map(([name, stats]) => {
            const val = centerViewMode === 'district' ? stats.tehsilSet.size : stats.labCount;
            const activeRatio = stats.pcCount > 0 ? Math.round((stats.onlinePcCount / stats.pcCount) * 100) : 0;
            const healthStatus = activeRatio >= 80 ? 'healthy' : activeRatio >= 50 ? 'warning' : 'critical';

            return {
                name,
                value: val,
                color: getStableColor(name),
                tehsilsCount: stats.tehsilSet.size,
                labsCount: stats.labCount,
                onlinePCs: stats.onlinePcCount,
                totalPCs: stats.pcCount,
                activeRatio,
                healthStatus
            };
        });
    }, [centerViewMode, statsMap, labs, selectedFilter]);

    const safeCityChartData = chartData.length > 0 ? chartData : [{ name: "No Data", value: 1, color: "#1e293b" }];

    // Dynamic Labels and Totals
    const centerDisplayTotal = useMemo(() => {
        if (selectedFilter) {
            if (selectedFilter.type === 'district') {
                return labs.filter((l) => l.city === selectedFilter.name).length;
            }
            if (selectedFilter.type === 'tehsil') return labs.filter((l) => l.tehsil === selectedFilter.name).length;
            if (selectedFilter.type === 'lab') {
                const lab = labs.find((l) => l.lab_name === selectedFilter.name);
                return Number(lab?.total_pcs || 0);
            }
        }
        return centerViewMode === 'pc' ? totalPCs :
               (centerViewMode === 'labs' ? totalLabs :
                (centerViewMode === 'tehsil' ? totalTehsils : totalCities));
    }, [selectedFilter, labs, totalPCs, totalLabs, totalTehsils, totalCities, centerViewMode]);

    const centerDisplayLabel = useMemo(() => {
        if (selectedFilter) {
            if (selectedFilter.type === 'district') return 'Labs';
            if (selectedFilter.type === 'tehsil') return 'Labs';
            if (selectedFilter.type === 'lab') return 'PCs';
        }
        return centerViewMode === 'pc' ? 'PCs' :
               (centerViewMode === 'labs' ? 'Labs' :
                (centerViewMode === 'tehsil' ? 'Tehsils' : 'Districts'));
    }, [selectedFilter, centerViewMode]);

    const handleCenterChartClick = (entry: ChartEntry) => {
        if (!entry || entry.name === "No Data") return;

        // Navigation for filtered District view (taking user to that specific tehsil's labs)
        if (selectedFilter?.type === 'district') {
            navigate(`/dashboard/labs?city=${encodeURIComponent(selectedFilter.name)}&tehsil=${encodeURIComponent(entry.name)}`);
            return;
        }

        // Navigation for filtered Tehsil view (taking user to that specific lab's summary)
        if (selectedFilter?.type === 'tehsil') {
            const lab = entry.fullData;
            if (lab) {
                navigate(`/dashboard/lab-summary/${encodeURIComponent(lab.city)}/${encodeURIComponent(lab.lab_name)}`);
            } else {
                // Fallback: search for labs in this tehsil
                navigate(`/dashboard/labs?tehsil=${encodeURIComponent(selectedFilter.name)}`);
            }
            return;
        }

        // Navigation for filtered Lab view (taking user to device list with specific status)
        if (selectedFilter?.type === 'lab') {
            const status = entry.name.toLowerCase();
            navigate(`/dashboard/devices?city=${encodeURIComponent(selectedFilter.district)}&lab=${encodeURIComponent(selectedFilter.name)}&status=${status}`);
            return;
        }

        // --- GLOBAL (Standard) Navigation Logic ---
        if (centerViewMode === 'pc') {
            navigate(`/dashboard/devices?status=${entry.name.toLowerCase()}`);
        } else if (centerViewMode === 'tehsil') {
            navigate(`/dashboard/labs?tehsil=${encodeURIComponent(entry.name)}`);
        } else if (centerViewMode === 'district') {
            // In standard "Total Districts" mode, clicking a slice goes to that city's lab list
            navigate(`/dashboard/labs?city=${encodeURIComponent(entry.name)}`);
        } else if (centerViewMode === 'labs') {
            const status = entry.name === 'Offline' ? 'all_offline' : entry.name.toLowerCase();
            navigate(`/dashboard/labs?status=${status}`);
        }
    };

    if (isLoading) return <div className="h-full w-full p-10"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

    return (
        <div className="h-full w-full p-4 md:p-8 flex flex-col items-center justify-start relative overflow-y-auto custom-scrollbar">
            {/* Ambient Background Glows */}
            <div className="absolute -top-20 left-1/4 -translate-x-1/2 w-[600px] h-[500px] blur-[120px] rounded-full pointer-events-none bg-[#7c4dff]/10" />
            <div className="absolute -top-20 right-1/4 translate-x-1/2 w-[600px] h-[500px] blur-[120px] rounded-full pointer-events-none bg-[#2979ff]/10" />

            {/* --- GLOBAL SEARCH BAR --- */}
            <div className="w-full flex justify-end z-50 mb-4 px-2">
                <div className="relative w-full max-w-[380px]" ref={searchRef}>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-white/60 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="w-full bg-[#1a1b3a]/80 backdrop-blur-2xl border-2 border-white/60 rounded-2xl py-3 pl-14 pr-12 text-white placeholder:text-white/70 focus:outline-none focus:border-primary/80 focus:ring-4 focus:ring-primary/20 transition-all text-sm font-bold"
                            placeholder="Quick search District, Tehsil, Lab..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery("")}
                                className="absolute inset-y-0 right-4 flex items-center text-white/60 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Suggestions Dropdown */}
                    {isSearchFocused && searchQuery.trim() !== "" && (
                        <div className="absolute top-full mt-3 right-0 w-full min-w-[320px] bg-[#1a1b3a]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 z-[60]">
                            {filteredSuggestions.length > 0 ? (
                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {filteredSuggestions.map((s, idx) => (
                                        <button
                                            key={`${s.type}-${s.name}-${idx}`}
                                            onClick={() => handleSelectSuggestion(s)}
                                            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-xl border ${
                                                    s.type === 'district' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                                    s.type === 'tehsil' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                                                    'bg-purple-500/10 border-purple-500/20 text-purple-500'
                                                }`}>
                                                    {s.type === 'district' ? <MapPin size={15} /> :
                                                     s.type === 'tehsil' ? <Landmark size={15} /> :
                                                     <Building2 size={15} />}
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{s.name}</p>
                                                    <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mt-0.5">
                                                        {s.type === 'lab' ? `${s. district} • ${s.tehsil}` : 
                                                         s.type === 'tehsil' ? `${s.district} District` : 
                                                         "Infrastructure Node"}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                                                s.type === 'district' ? 'border-amber-500/20 text-amber-500 bg-amber-500/5' :
                                                s.type === 'tehsil' ? 'border-blue-500/20 text-blue-500 bg-blue-500/5' :
                                                'border-purple-500/20 text-purple-500 bg-purple-500/5'
                                            }`}>
                                                {s.type}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <Search className="w-8 h-8 text-white/10 mx-auto mb-3" />
                                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">No existing entity found</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 w-full max-w-[1200px] mt-[15vh] mb-auto flex flex-col xl:flex-row items-center justify-center gap-8 xl:gap-24 min-h-[60vh] pb-10">

                {/* --- LEFT: Buttons (District Controls) --- */}
                <div className="flex flex-col items-center xl:items-start gap-5 w-full max-w-[260px]">
                    {selectedFilter && (
                        <div className="w-full p-4 bg-primary/10 border border-primary/20 rounded-2xl flex flex-col gap-2 mb-2 animate-in slide-in-from-left-4 duration-500">
                             <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Active Filter</p>
                                <button onClick={() => setSelectedFilter(null)} className="text-white/40 hover:text-white">
                                    <X size={14} />
                                </button>
                             </div>
                             <div className="flex items-center gap-2">
                                <Layout className="w-4 h-4 text-white" />
                                <p className="text-xs font-bold text-white uppercase">{selectedFilter.name}</p>
                             </div>
                             <button 
                                onClick={() => setSelectedFilter(null)}
                                className="mt-2 w-full py-2 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-white/60 rounded-lg transition-all"
                             >
                                Clear Context
                             </button>
                        </div>
                    )}
                    <div className="flex flex-col gap-3 w-full mt-1">
                        {[
                            { id: 'district', label: 'DISTRICT' },
                            { id: 'tehsil', label: 'TEHSIL' },
                            { id: 'labs', label: 'LABS' },
                            { id: 'pc', label: 'PC' }
                        ].map((btn) => {
                            const isActive = centerViewMode === btn.id;
                            const isLabs = btn.id === 'labs';
                            const isPC = btn.id === 'pc';
                            const isDistrict = btn.id === 'district';
                            const isTehsil = btn.id === 'tehsil';

                            return (
                                <button
                                    key={btn.id}
                                    onClick={() => setCenterViewMode(btn.id)}
                                    className={cn(
                                        "px-6 py-2.5 rounded-xl font-black text-[10px] tracking-[0.2em] transition-all duration-500 border w-full",
                                        isActive && "scale-105",
                                        isDistrict && (isActive ? "bg-gradient-to-r from-blue-700 to-blue-900 text-white border-blue-600 shadow-[0_0_35px_rgba(29,78,216,0.4)]" : "bg-blue-700/20 text-blue-400/60 border-blue-700/30 hover:bg-blue-700/30"),
                                        isTehsil && (isActive ? "bg-gradient-to-r from-blue-600 to-blue-800 text-white border-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.35)]" : "bg-blue-600/20 text-blue-500/60 border-blue-600/30 hover:bg-blue-600/30"),
                                        isLabs && (isActive ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.3)]" : "bg-blue-500/20 text-blue-400/60 border-blue-500/30 hover:bg-blue-500/30"),
                                        isPC && (isActive ? "bg-gradient-to-r from-blue-400 to-blue-600 text-white border-blue-300 shadow-[0_0_20px_rgba(96,165,250,0.25)]" : "bg-blue-400/20 text-blue-300/60 border-blue-400/30 hover:bg-blue-400/30")
                                    )}
                                >
                                    {isActive ? `• ${btn.label} •` : btn.label}
                                </button>
                            );
                        })}
                    </div>
                </div>



                {/* --- RIGHT: District Distribution Circle --- */}
                <div className="flex flex-col items-center gap-4 w-full max-w-[420px] animate-in zoom-in-95 duration-1000">
                    <div className="text-center space-y-1">
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-[0.3em] text-white/90">
                            {selectedFilter ? selectedFilter.name : `Total ${centerDisplayLabel}`}
                        </h2>
                        <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-auto rounded-full" />
                    </div>

                    <div className="relative w-full aspect-square shrink-0 flex items-center justify-center" style={{ minHeight: '280px' }}>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-600/5 to-indigo-600/5 blur-[50px]" />

                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none group/center">
                            <div 
                                className="pointer-events-auto cursor-pointer flex flex-col items-center justify-center rounded-full p-4"
                                onClick={() => {
                                    if (selectedFilter) {
                                        if (selectedFilter.type === 'district') navigate(`/dashboard/labs?city=${encodeURIComponent(selectedFilter.name)}`);
                                        else if (selectedFilter.type === 'tehsil') navigate(`/dashboard/labs?tehsil=${encodeURIComponent(selectedFilter.name)}`);
                                        else if (selectedFilter.type === 'lab') navigate(`/dashboard/lab-summary/${encodeURIComponent(selectedFilter.district)}/${encodeURIComponent(selectedFilter.name)}`);
                                    } else {
                                        if (centerViewMode === 'district') navigate(`/dashboard/cities`);
                                        else if (centerViewMode === 'tehsil') navigate(`/dashboard/cities`);
                                        else if (centerViewMode === 'labs') navigate(`/dashboard/labs`);
                                        else if (centerViewMode === 'pc') navigate(`/dashboard/devices`);
                                    }
                                }}
                            >
                                <span className="text-7xl font-black text-white tracking-tighter italic drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] group-hover/center:text-primary transition-colors">
                                    {centerDisplayTotal}
                                </span>
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] -mt-2 opacity-80 group-hover/center:opacity-100">
                                    {centerDisplayLabel}
                                </span>
                            </div>
                        </div>

                        <ResponsiveContainer width="100%" height="100%" className="pointer-events-none">
                            <PieChart style={{ pointerEvents: 'auto' }}>
                                <Pie
                                    data={safeCityChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="68%"
                                    outerRadius="86%"
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                    startAngle={90}
                                    endAngle={-270}
                                    activeIndex={activeIndex}
                                    activeShape={renderActiveShape}
                                    onClick={(data: ChartEntry) => handleCenterChartClick(data)}
                                    onMouseEnter={(data, index) => {
                                        if (data && data.name !== "No Data") {
                                            setHoveredData(data as ChartEntry);
                                            setActiveIndex(index);
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        setHoveredData(null);
                                        setActiveIndex(undefined);
                                    }}
                                >
                                    {safeCityChartData.map((entry, index) => {
                                        const fillColor = entry.name === 'Online' ? '#00a629' :
                                                         entry.name === 'Offline' ? '#7c3aed' :
                                                         entry.color;
                                        return (
                                            <Cell
                                                key={`cell-c-${index}`}
                                                fill={fillColor}
                                                className="cursor-pointer"
                                                style={{ filter: `drop-shadow(0px 0px 8px ${fillColor}50)` }}
                                            />
                                        );
                                    })}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>


                    </div>
                </div>

                {/* --- RIGHT MOST: Hover Detail Card --- */}
                <div className="w-[220px] shrink-0 flex items-center justify-center min-h-[200px]">
                    {hoveredData ? (
                        <ActiveDetailCard data={hoveredData} viewMode={centerViewMode} activeFilter={selectedFilter} />
                    ) : (
                        <div className="w-[220px] shrink-0 p-[2px] rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.8)] animate-in fade-in duration-500">
                            <div className="bg-[#0b0c1e] rounded-[1.4rem] p-5 h-full flex flex-col justify-center items-center text-center gap-3 min-h-[220px]">
                                <Activity className="w-8 h-8 text-white/20 animate-pulse" />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">Fleet Analysis</span>
                                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-relaxed">
                                    Hover any segment of the graph to display detailed node telemetry and health metrics.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
