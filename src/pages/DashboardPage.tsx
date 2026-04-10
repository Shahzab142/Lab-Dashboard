import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const COLORS = [
    "#0070f3",
    "#ff9900",
    "#00e676",
    "#d500f9",
    "#ff4081",
    "#00bcd4",
    "#ffeb3b",
    "#7c4dff",
    "#ff1744",
    "#1de9b6",
];

const CustomTooltip = ({ active, payload, viewMode }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        if (data.name === "No Data") return null;

        let label = "Units";
        if (viewMode === 'district') label = "Total Tehsils";
        else if (viewMode === 'tehsil') label = "Total Labs";
        else if (viewMode === 'labs') label = "Total Labs";
        else if (viewMode === 'pc') label = "Total PCs";

        return (
            <div className="bg-background/95 backdrop-blur-2xl border border-white/10 px-8 py-6 rounded-[2rem] shadow-[0_0_80px_-12px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200 min-w-[220px]">
                <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                    <div
                        className="w-2.5 h-2.5 rounded-full shadow-[0_0_15px_currentColor]"
                        style={{ color: data.color, backgroundColor: data.color }}
                    />
                    <span className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
                        {data.name}
                    </span>
                </div>
                <div className="flex justify-between items-center gap-8">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
                        {label}
                    </span>
                    <p className="text-4xl font-black text-white leading-none tracking-tighter italic">
                        {data.value}
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export default function DashboardPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const { data, isLoading } = useQuery({
        queryKey: ["global-lab-stats"],
        queryFn: () => apiFetch("/stats/labs/all"),
        refetchInterval: 10000,
    });

    const centerViewMode = (searchParams.get('centerView') as 'district' | 'tehsil' | 'labs' | 'pc') || 'district';

    const setCenterViewMode = (mode: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('centerView', mode);
        setSearchParams(newParams);
    };

    const labs = (Array.isArray(data?.labs) ? data.labs : []).filter((l: any) => l && typeof l === 'object');

    const totalPCs = labs.reduce((acc: number, l: any) => acc + Number(l.total_pcs || 0), 0);

    // --- DISTRIBUTION (Center/Right circle) ---
    const statsMap = new Map<string, { labCount: number, pcCount: number, tehsilSet: Set<string> }>();
    const uniqueTehsils = new Set<string>();
    const cityStatsMap = new Map<string, any>();

    labs.forEach((l: any) => {
        const city = l.city || 'Unknown';
        const tehsil = l.tehsil || 'Unknown';
        uniqueTehsils.add(`${city}|${tehsil}`);
        cityStatsMap.set(city, true);

        const groupKey = centerViewMode === 'tehsil' ? tehsil : city;
        const current = statsMap.get(groupKey) || { labCount: 0, pcCount: 0, tehsilSet: new Set<string>() };
        current.tehsilSet.add(tehsil);
        statsMap.set(groupKey, {
            labCount: current.labCount + 1,
            pcCount: current.pcCount + Number(l.total_pcs || 0),
            tehsilSet: current.tehsilSet
        });
    });

    const totalCities = cityStatsMap.size;
    const totalTehsils = uniqueTehsils.size;
    const totalLabs = labs.length;

    const chartData = Array.from(statsMap.entries()).map(([name, stats], index) => ({
        name,
        value:
            centerViewMode === 'pc' ? stats.pcCount :
                centerViewMode === 'district' ? stats.tehsilSet.size :
                    stats.labCount,
        color: COLORS[index % COLORS.length]
    }));

    const safeCityChartData = chartData.length > 0 ? chartData : [{ name: "No Data", value: 1, color: "#1e293b" }];
    const centerDisplayTotal =
        centerViewMode === 'pc' ? totalPCs :
            (centerViewMode === 'labs' ? totalLabs :
                (centerViewMode === 'tehsil' ? totalTehsils : totalCities));
    const centerDisplayLabel =
        centerViewMode === 'pc' ? 'PCs' :
            (centerViewMode === 'labs' ? 'Labs' :
                (centerViewMode === 'tehsil' ? 'Tehsils' : 'Districts'));

    const handleCenterChartClick = (entry: any) => {
        if (entry.name === "No Data") return;
        if (centerViewMode === 'pc') {
            navigate(`/dashboard/devices?city=${entry.name}`);
        } else if (centerViewMode === 'tehsil') {
            navigate(`/dashboard/labs?tehsil=${entry.name}`);
        } else if (centerViewMode === 'district') {
            navigate(`/dashboard/overview`);
        } else {
            navigate(`/dashboard/labs?city=${entry.name}`);
        }
    };

    if (isLoading) return <div className="h-full w-full p-10"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

    return (
        <div className="h-[90vh] w-full p-4 md:p-8 flex flex-col items-center justify-start relative overflow-y-auto custom-scrollbar">
            {/* Ambient Background Glows */}
            <div className="absolute -top-20 left-1/4 -translate-x-1/2 w-[600px] h-[500px] blur-[120px] rounded-full pointer-events-none bg-[#7c4dff]/10" />
            <div className="absolute -top-20 right-1/4 translate-x-1/2 w-[600px] h-[500px] blur-[120px] rounded-full pointer-events-none bg-[#2979ff]/10" />

            <div className="relative z-10 w-full max-w-[1400px] -mt-4 grid grid-cols-1 xl:grid-cols-3 gap-8 items-center pb-20">

                {/* --- LEFT: Buttons (District Controls) --- */}
                <div className="flex flex-col items-start gap-4 w-full max-w-[320px]">
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-[0.2em] drop-shadow-2xl z-20 bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
                        Distribution
                    </h2>
                    <div className="flex flex-col gap-4 w-full mt-2">
                        <button
                            onClick={() => setCenterViewMode('district')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 border ${centerViewMode === 'district'
                                ? 'bg-[#7c4dff] text-white border-[#7c4dff] shadow-[0_0_20px_rgba(124,77,255,0.4)] scale-105'
                                : 'bg-transparent text-[#7c4dff] border-[#7c4dff]/30 hover:border-[#7c4dff] hover:bg-[#7c4dff]/10'
                                }`}
                        >
                            DISTRICT
                        </button>
                        <button
                            onClick={() => setCenterViewMode('tehsil')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 border ${centerViewMode === 'tehsil'
                                ? 'bg-[#7c4dff] text-white border-[#7c4dff] shadow-[0_0_20px_rgba(124,77,255,0.4)] scale-105'
                                : 'bg-transparent text-[#7c4dff] border-[#7c4dff]/30 hover:border-[#7c4dff] hover:bg-[#7c4dff]/10'
                                }`}
                        >
                            TEHSIL
                        </button>
                        <button
                            onClick={() => setCenterViewMode('labs')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 border ${centerViewMode === 'labs'
                                ? 'bg-[#7c4dff] text-white border-[#7c4dff] shadow-[0_0_20px_rgba(124,77,255,0.4)] scale-105'
                                : 'bg-transparent text-[#7c4dff] border-[#7c4dff]/30 hover:border-[#7c4dff] hover:bg-[#7c4dff]/10'
                                }`}
                        >
                            LABS
                        </button>
                        <button
                            onClick={() => setCenterViewMode('pc')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 border ${centerViewMode === 'pc'
                                ? 'bg-[#7c4dff] text-white border-[#7c4dff] shadow-[0_0_20px_rgba(124,77,255,0.4)] scale-105'
                                : 'bg-transparent text-[#7c4dff] border-[#7c4dff]/30 hover:border-[#7c4dff] hover:bg-[#7c4dff]/10'
                                }`}
                        >
                            PC
                        </button>
                    </div>
                </div>

                {/* --- CENTER: Empty Space --- */}
                <div className="hidden xl:block" />

                {/* --- RIGHT: District Distribution Circle --- */}
                <div className="flex flex-col items-center gap-8 w-full max-w-[400px] justify-self-end animate-in zoom-in-95 duration-700">
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-[0.2em] drop-shadow-2xl z-20 bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
                        Total {centerDisplayLabel}
                    </h2>
                    <div className="relative w-full aspect-square group shrink-0" style={{ minHeight: '300px' }}>
                        <div className="absolute inset-0 rounded-full border border-white/5 scale-[0.85] opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out" />
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart width={300} height={300}>
                                <Pie
                                    data={safeCityChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="60%"
                                    outerRadius="75%"
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                    startAngle={90}
                                    endAngle={-270}
                                    onClick={handleCenterChartClick}
                                >
                                    {safeCityChartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-c-${index}`}
                                            fill={entry.color}
                                            className="transition-all duration-500 hover:brightness-110 cursor-pointer filter drop-shadow-2xl hover:stroke-white hover:stroke-2"
                                            style={{ filter: `drop-shadow(0px 0px 10px ${entry.color}80)` }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip viewMode={centerViewMode} />} cursor={false} />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none fade-in">
                            <span className="text-7xl font-black text-[#7c4dff] tracking-tighter drop-shadow-[0_0_15px_rgba(124,77,255,0.5)] animate-in zoom-in-50 duration-300">
                                {centerDisplayTotal}
                            </span>
                            <span className="text-[10px] font-bold text-[#7c4dff]/60 uppercase tracking-[0.4em] mt-2 ml-1">
                                {centerDisplayLabel}
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
