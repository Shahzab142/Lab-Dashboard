import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Loader2, Search, X, MapPin, Building2, Layout, Landmark } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRef, useEffect } from "react";

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
}

interface SearchSuggestion {
    type: 'district' | 'tehsil' | 'lab';
    name: string;
    district: string;
    tehsil?: string;
}

const ActiveDetailCard = ({ data, viewMode }: { data: ChartEntry | null, viewMode: string }) => {
    if (!data) return null;

    let label = "Units";
    if (viewMode === 'district') label = "Total Tehsils";
    else if (viewMode === 'tehsil') label = "Total Labs";
    else if (viewMode === 'labs') label = "Total Labs";
    else if (viewMode === 'pc') label = "Total PCs";

    const accentColor = data.color.startsWith('url') ? (data.name === 'Online' ? '#10B981' : '#f43f5e') : data.color;

    return (
        <div className="absolute -top-12 -right-48 p-6 bg-[#1a1b3a]/90 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-top-4 fade-in duration-500 min-w-[220px] z-50 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -mr-16 -mt-16 rounded-full" />
            <div className="relative z-10 flex flex-col gap-5">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <div
                        className="w-3 h-3 rounded-full shadow-[0_0_20px_currentColor] animate-pulse"
                        style={{ color: accentColor, backgroundColor: accentColor }}
                    />
                    <span className="text-[12px] font-black text-white uppercase tracking-[0.2em] italic truncate max-w-[160px]">
                        {data.name}
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em] mb-2 ml-1">
                        {label}
                    </span>
                    <p className="text-5xl font-black text-white leading-none tracking-tighter italic drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                        {data.value}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default function DashboardPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [hoveredData, setHoveredData] = useState<ChartEntry | null>(null);
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
        const stats = new Map<string, { labCount: number, pcCount: number, tehsilSet: Set<string> }>();
        const tehsils = new Set<string>();
        const cities = new Map<string, boolean>();

        labs.forEach((l) => {
            const city = l.city || 'Unknown';
            const tehsil = l.tehsil || 'Unknown';
            tehsils.add(`${city}|${tehsil}`);
            cities.set(city, true);

            const groupKey = centerViewMode === 'tehsil' ? tehsil : city;
            const current = stats.get(groupKey) || { labCount: 0, pcCount: 0, tehsilSet: new Set<string>() };
            current.tehsilSet.add(tehsil);
            stats.set(groupKey, {
                labCount: current.labCount + 1,
                pcCount: current.pcCount + Number(l.total_pcs || 0),
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
                return Array.from(tehsilMap.entries()).map(([name, value], index) => ({
                    name,
                    value,
                    color: COLORS[index % COLORS.length]
                }));
            }

            if (selectedFilter.type === 'tehsil') {
                const tehsilLabs = labs.filter((l) => l.tehsil === selectedFilter.name);
                return tehsilLabs.map((l, index) => ({
                    name: l.lab_name || 'Unknown Lab',
                    value: Number(l.total_pcs || 1),
                    color: COLORS[index % COLORS.length],
                    fullData: l
                }));
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

        return Array.from(statsMap.entries()).map(([name, stats], index) => {
            const val = centerViewMode === 'district' ? stats.tehsilSet.size : stats.labCount;
            return {
                name,
                value: val,
                color: COLORS[index % COLORS.length]
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
        <div className="h-[90vh] w-full p-4 md:p-8 flex flex-col items-center justify-start relative overflow-y-auto custom-scrollbar">
            {/* Ambient Background Glows */}
            <div className="absolute -top-20 left-1/4 -translate-x-1/2 w-[600px] h-[500px] blur-[120px] rounded-full pointer-events-none bg-[#7c4dff]/10" />
            <div className="absolute -top-20 right-1/4 translate-x-1/2 w-[600px] h-[500px] blur-[120px] rounded-full pointer-events-none bg-[#2979ff]/10" />

            {/* --- GLOBAL SEARCH BAR --- */}
            <div className="w-full flex justify-end z-50 mb-4 px-2">
                <div className="relative w-full max-w-[380px]" ref={searchRef}>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-white/30 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="w-full bg-[#1a1b3a]/60 backdrop-blur-2xl border border-white/10 rounded-2xl py-3 pl-14 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                            placeholder="Quick search District, Tehsil, Lab..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery("")}
                                className="absolute inset-y-0 right-4 flex items-center text-white/20 hover:text-white transition-colors"
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

            <div className="relative z-10 w-full max-w-[1100px] mt-24 flex flex-col xl:flex-row items-center justify-center gap-12 xl:gap-24 min-h-[60vh] pb-20">

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
                <div className="flex flex-col items-center gap-8 w-full max-w-[450px] animate-in zoom-in-95 duration-1000">
                    <div className="text-center space-y-1">
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-[0.3em] text-white/90 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            {selectedFilter ? selectedFilter.name : `Total ${centerDisplayLabel}`}
                        </h2>
                        <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-auto rounded-full" />
                    </div>
                    
                    <div className="relative w-full aspect-square group shrink-0 flex items-center justify-center transition-all duration-700" style={{ minHeight: '260px' }}>
                        
                        {/* Hover Detail Card fixed in space - back inside the square as requested */}
                        <ActiveDetailCard data={hoveredData} viewMode={centerViewMode} />

                        {/* Elegant background glows */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-600/5 to-indigo-600/5 blur-[50px]" />
                        <div className="absolute inset-0 rounded-full border border-white/5 scale-[0.98]" />

                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={safeCityChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="70%"
                                    outerRadius="88%"
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                    startAngle={90}
                                    endAngle={-270}
                                    onClick={(data: ChartEntry) => handleCenterChartClick(data)}
                                    onMouseEnter={(_, index) => {
                                        if (safeCityChartData[index]?.name !== "No Data") {
                                            setHoveredData(safeCityChartData[index]);
                                        }
                                    }}
                                    onMouseLeave={() => setHoveredData(null)}
                                >
                                    {safeCityChartData.map((entry, index) => {
                                        const fillColor = entry.name === 'Online' ? '#00a629' : 
                                                         entry.name === 'Offline' ? '#7c3aed' : 
                                                         entry.color;
                                        
                                        return (
                                            <Cell
                                                key={`cell-c-${index}`}
                                                fill={fillColor}
                                                className="transition-all duration-500 hover:brightness-110 cursor-pointer"
                                                style={{ 
                                                    filter: `drop-shadow(0px 0px 10px ${fillColor}40)`,
                                                }}
                                            />
                                        );
                                    })}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        
                        <div 
                            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto cursor-pointer group/center"
                            onClick={() => {
                                if (selectedFilter) {
                                    if (selectedFilter.type === 'district') navigate(`/dashboard/labs?city=${encodeURIComponent(selectedFilter.name)}`);
                                    else if (selectedFilter.type === 'tehsil') navigate(`/dashboard/labs?tehsil=${encodeURIComponent(selectedFilter.name)}`);
                                    else if (selectedFilter.type === 'lab') navigate(`/dashboard/lab-summary/${encodeURIComponent(selectedFilter.district)}/${encodeURIComponent(selectedFilter.name)}`);
                                } else {
                                    if (centerViewMode === 'district') navigate(`/dashboard/cities`);
                                    else if (centerViewMode === 'tehsil') navigate(`/dashboard/cities`); // Redirect to Tehsilwise Lab list instead of broken Tehsils view
                                    else if (centerViewMode === 'labs') navigate(`/dashboard/labs`);
                                    else if (centerViewMode === 'pc') navigate(`/dashboard/devices`);
                                }
                            }}
                        >
                            <span className="text-7xl font-black text-white tracking-tighter italic drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] animate-in zoom-in duration-1000 group-hover/center:text-primary transition-colors">
                                {centerDisplayTotal}
                            </span>
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] -mt-2 opacity-80 drop-shadow-[0_0_10px_rgba(249,154,29,0.5)] group-hover/center:opacity-100">
                                {centerDisplayLabel}
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
