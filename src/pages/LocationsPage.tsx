import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, ArrowRight, Search, Building2, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
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

    const { data: locations = [], isLoading } = useQuery({
        queryKey: ['location-stats'],
        queryFn: () => apiFetch('/stats/locations'),
        refetchInterval: 10000
    });

    const handleRenameCity = async (e: React.MouseEvent, oldName: string) => {
        e.stopPropagation();
        const newName = prompt("Enter new name for city:", oldName);
        if (!newName || newName === oldName) return;

        try {
            await apiFetch('/stats/city/rename', {
                method: 'PATCH',
                body: JSON.stringify({ old_name: oldName, new_name: newName })
            });
            toast.success(`City renamed to ${newName}`);
            queryClient.invalidateQueries({ queryKey: ['location-stats'] });
        } catch (err) {
            toast.error("Failed to rename city");
        }
    };

    const handleDeleteCity = async (e: React.MouseEvent, cityName: string) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete ${cityName}? This will remove all PCs in this city.`)) return;

        try {
            await apiFetch(`/stats/city/delete?city=${cityName}`, { method: 'DELETE' });
            toast.success(`${cityName} and its nodes deleted.`);
            queryClient.invalidateQueries({ queryKey: ['location-stats'] });
        } catch (err) {
            toast.error("Failed to delete city");
        }
    };

    const filteredLocations = locations.filter((loc: any) =>
        loc.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-right-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">
                        CITY <span className="text-primary">NETWORKS</span>
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1 uppercase tracking-widest text-[10px]">
                        Infrastructure Distribution by Region
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="SEARCH CITIES..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 bg-black/40 border-white/5 focus:border-primary/50 text-[10px] font-bold uppercase tracking-widest h-11 rounded-xl"
                        />
                    </div>
                </div>
            </header>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-72 rounded-3xl" />)}
                </div>
            ) : filteredLocations.length === 0 ? (
                <Card className="bg-white/5 border-dashed border-white/10 p-20 text-center">
                    <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-30" />
                    <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">
                        No Cities Registered
                    </h3>
                    <p className="text-muted-foreground text-sm uppercase font-bold tracking-widest mt-2">
                        Configure agents in new cities to see them here.
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredLocations.map((loc: any) => {
                        const graphData = [
                            { name: 'Total Labs', val: loc.total_labs },
                            { name: 'Online Labs', val: loc.online_labs },
                            { name: 'Offline Labs', val: loc.offline_labs },
                        ];

                        return (
                            <Card
                                key={loc.city}
                                onClick={() => navigate(`/dashboard/labs?city=${loc.city}`)}
                                className="group relative overflow-hidden bg-black/40 border-white/5 backdrop-blur-3xl cursor-pointer hover:border-primary/50 transition-all hover:scale-[1.02]"
                            >
                                <CardContent className="p-8 space-y-6">
                                    <div className="flex items-start justify-between relative">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 rounded-2xl bg-white/5 text-primary">
                                                <MapPin size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white group-hover:text-primary transition-colors">
                                                    {loc.city}
                                                </h2>
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Regional Hub</p>
                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white">
                                                    <MoreVertical size={20} />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-black/90 border-white/10 backdrop-blur-xl">
                                                <DropdownMenuItem onClick={(e) => handleRenameCity(e, loc.city)} className="gap-2 text-white hover:bg-white/10 cursor-pointer">
                                                    <Edit2 size={14} /> Rename City
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => handleDeleteCity(e, loc.city)} className="gap-2 text-red-500 hover:bg-red-500/10 cursor-pointer">
                                                    <Trash2 size={14} /> Delete City
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Lab Status Graph Overlay */}
                                    <div className="h-24 w-full relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={graphData}>
                                                <Line
                                                    type="monotone"
                                                    dataKey="val"
                                                    stroke="#06b6d4"
                                                    strokeWidth={3}
                                                    dot={{ fill: '#06b6d4', r: 4 }}
                                                    activeDot={{ r: 6, stroke: '#fff' }}
                                                />
                                                <Tooltip
                                                    contentStyle={{ background: '#000', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }}
                                                    itemStyle={{ color: '#06b6d4' }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pb-2">
                                        <div className="p-3 rounded-xl bg-black/60 border border-white/5">
                                            <Building2 className="w-4 h-4 text-primary mb-1" />
                                            <span className="block text-[8px] font-bold text-muted-foreground uppercase">Total Labs</span>
                                            <span className="text-sm font-black text-white">{loc.total_labs} Units</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-success/5 border border-success/10">
                                            <div className="w-2 h-2 rounded-full bg-success mb-2 animate-pulse" />
                                            <span className="block text-[8px] font-bold text-success uppercase">Active Labs</span>
                                            <span className="text-sm font-black text-success">{loc.online_labs} Online</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex justify-end">
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-primary italic opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                            VIEW LAB CLUSTERS <ArrowRight size={12} />
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
