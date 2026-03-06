import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
<<<<<<< HEAD
import { MapPin, Search, MoreVertical, Edit2, Globe } from 'lucide-react';
=======
import { MapPin, Search, MoreVertical, Edit2 } from 'lucide-react';
>>>>>>> 66ae7c1203dc72ac37ef8ba3c0744ac73f438bfd
import { Card, CardContent } from '@/components/ui/card';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
<<<<<<< HEAD
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
=======
>>>>>>> 66ae7c1203dc72ac37ef8ba3c0744ac73f438bfd
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function LocationsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchParams] = useSearchParams();
    const cityParam = searchParams.get('city');
    const tehsilParam = searchParams.get('tehsil');
    const status = searchParams.get('status');

    const { data: response, isLoading } = useQuery({
        queryKey: ['tehsil-stats-global'],
        queryFn: () => apiFetch('/stats/tehsils'),
        refetchInterval: 10000,
        staleTime: 5000,
        gcTime: 30000
    });

    const tehsils = Array.isArray(response?.tehsils) ? response.tehsils : [];

    // DEBUG: Log the fetched data for verification
<<<<<<< HEAD
    // console.log("Tehsil Data Fetched:", tehsils);
=======
    console.log("Tehsil Data Fetched:", tehsils);
>>>>>>> 66ae7c1203dc72ac37ef8ba3c0744ac73f438bfd

    const handleRenameTehsil = async (e: React.MouseEvent, oldName: string, cityName: string) => {
        e.stopPropagation();
        const newName = prompt("Enter new name for tehsil:", oldName);
        if (!newName || newName === oldName) return;
        try {
            await apiFetch('/stats/tehsil/rename', {
                method: 'PATCH',
                body: JSON.stringify({ city: cityName, old_name: oldName, new_name: newName })
            });
            toast.success(`Tehsil renamed to ${newName}`);
            queryClient.invalidateQueries({ queryKey: ['tehsil-stats-global'] });
        } catch (err) {
            toast.error("Failed to rename tehsil");
        }
    };

    const filteredTehsils = tehsils
        .filter((t: any) => {
            const tName = (t?.tehsil || '').toLowerCase();
            const cName = (t?.city || '').toLowerCase();
            const sTerm = searchTerm.toLowerCase();

            const matchesSearch = tName.includes(sTerm) || cName.includes(sTerm);

            let matchesStatus = true;
            if (status === 'online') {
                matchesStatus = (t.online || 0) > 0;
            } else if (status === 'offline') {
                matchesStatus = (t.online || 0) === 0;
            }

            let matchesTehsilParam = true;
            if (tehsilParam) {
                matchesTehsilParam = tName === tehsilParam.toLowerCase();
            }

            let matchesCityParam = true;
            if (cityParam) {
                matchesCityParam = cName === cityParam.toLowerCase();
            }

            return matchesSearch && matchesStatus && matchesTehsilParam && matchesCityParam;
        })
        .sort((a: any, b: any) => (b.total_labs || 0) - (a.total_labs || 0));

    const maxLabsInTehsil = useMemo(() => {
        if (!filteredTehsils || filteredTehsils.length === 0) return 10;
        return Math.max(...filteredTehsils.map((t: any) => t.total_labs || 0), 5);
    }, [filteredTehsils]);

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-right-4 duration-700 bg-background min-h-screen">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight uppercase text-white font-display">
                        {status ? `${status} TEHSILS` : 'TEHSILWISE LAB'}
                    </h1>

                    <p className="text-white font-bold mt-1 uppercase tracking-wider text-[10px]">
                        {status === 'online' ? 'Active Tehsil Hubs' : status === 'offline' ? 'Inactive Tehsil Hubs' : 'Distribution of Institutional Computing Resources across Tehsils'}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-all" />
                        <Input
                            placeholder="SEARCH BY TEHSIL OR CITY..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 bg-card border-border focus:ring-1 focus:ring-primary text-[10px] font-bold uppercase tracking-wider h-10 rounded-lg transition-all shadow-sm"
                        />
                    </div>
                </div>
            </header>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
                </div>
            ) : filteredTehsils.length === 0 ? (
                <div className="p-20 text-center bg-card border border-dashed border-border rounded-2xl shadow-sm">
                    <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-20" />
                    <h3 className="text-xl font-bold text-primary uppercase tracking-tight">No Active Tehsils Detected</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTehsils.map((t: any, index: number) => {
                        const totalLabs = t.total_labs || 0;
                        const online = t.online || 0;
                        const pieData = [
                            { name: 'Labs', value: totalLabs },
                            { name: 'Remaining', value: Math.max(0, maxLabsInTehsil - totalLabs) }
                        ];

                        return (
                            <Card
                                key={`${t.city}-${t.tehsil}-${index}`}
                                onClick={() => navigate(`/dashboard/labs?city=${t.city}&tehsil=${t.tehsil}`)}
                                className="group relative overflow-hidden bg-card cursor-pointer border border-border hover:border-primary/40 transition-all hover:translate-y-[-4px] shadow-sm hover:shadow-lg rounded-2xl min-h-[220px] flex flex-col"
                            >
                                <CardContent className="p-5 flex flex-col justify-between flex-1 space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 rounded-lg bg-primary text-black shrink-0 transition-transform group-hover:scale-110">
                                                <MapPin size={14} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <h2 className="text-md font-bold tracking-tight uppercase text-white group-hover:text-white/80 transition-colors truncate font-display">
                                                    {t.tehsil}
                                                </h2>
                                                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{t.city}</p>
                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <button className="p-1.5 hover:bg-white/5 rounded transition-colors text-white/20 shrink-0">
                                                    <MoreVertical size={14} />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-card border border-border rounded-xl p-1.5 shadow-2xl backdrop-blur-xl">
                                                <DropdownMenuItem onClick={(e) => handleRenameTehsil(e, t.tehsil, t.city)} className="gap-2 text-[10px] font-bold uppercase p-2.5 rounded-lg transition-all focus:bg-primary focus:text-black">
                                                    <Edit2 size={12} className="text-primary group-focus:text-black" /> Rename
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Gauge Section */}
                                    <div className="flex-1 flex flex-col items-center justify-end relative h-24 my-1">
                                        <div className="h-24 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart width={100} height={100}>
                                                    <defs>
                                                        <linearGradient id="gaugeGradientTehsil" x1="0" y1="0" x2="1" y2="0">
                                                            <stop offset="0%" stopColor="#f99a1d" stopOpacity={0.6} />
                                                            <stop offset="100%" stopColor="#f99a1d" stopOpacity={1} />
                                                        </linearGradient>
                                                    </defs>
                                                    <Pie
                                                        data={pieData}
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
                                                        <Cell fill="url(#gaugeGradientTehsil)" className="drop-shadow-[0_0_8px_rgba(249,154,29,0.3)]" />
                                                        <Cell fill="rgba(255, 255, 255, 0.03)" />
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                                            <div className="text-2xl font-black text-white leading-none">
                                                {totalLabs}
                                            </div>
                                            <div className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] mt-0.5">
                                                LABS
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
            )}
        </div>
    );
}
