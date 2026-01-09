import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Monitor, ArrowRight, Building2, Search, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function LabsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const city = searchParams.get('city');
    const [searchTerm, setSearchTerm] = useState('');

    const { data: labs = [], isLoading } = useQuery({
        queryKey: ['lab-stats', city],
        queryFn: () => apiFetch(`/stats/city/${city}/labs`),
        enabled: !!city,
        refetchInterval: 10000
    });

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
            queryClient.invalidateQueries({ queryKey: ['lab-stats'] });
        } catch (err) {
            toast.error("Failed to rename lab");
        }
    };

    const handleDeleteLab = async (e: React.MouseEvent, labName: string) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete ${labName}? This will remove all PCs in this lab.`)) return;

        try {
            await apiFetch(`/stats/lab/delete?city=${city}&lab=${labName}`, { method: 'DELETE' });
            toast.success(`${labName} and its nodes deleted.`);
            queryClient.invalidateQueries({ queryKey: ['lab-stats'] });
        } catch (err) {
            toast.error("Failed to delete lab");
        }
    };

    const filteredLabs = labs.filter((lab: any) =>
        lab.lab_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-right-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-primary hover:bg-primary/10"
                            onClick={() => navigate('/dashboard/cities')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" /> BACK TO CITIES
                        </Button>
                    </div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">
                        <span className="text-primary">{city?.toUpperCase()}</span> LABS
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1 uppercase tracking-widest text-[10px]">
                        Internal Facility Monitoring & PC Availability
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="SEARCH LABS..."
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
            ) : filteredLabs.length === 0 ? (
                <Card className="bg-white/5 border-dashed border-white/10 p-20 text-center">
                    <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-30" />
                    <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">
                        No Labs Found
                    </h3>
                    <p className="text-muted-foreground text-sm uppercase font-bold tracking-widest mt-2">
                        No laboratories are registered in this city yet.
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredLabs.map((lab: any) => {
                        const graphData = [
                            { name: 'Total PCs', val: lab.total_pcs },
                            { name: 'Online', val: lab.online },
                            { name: 'Offline', val: lab.offline },
                        ];

                        return (
                            <Card
                                key={lab.lab_name}
                                onClick={() => navigate(`/dashboard/devices?city=${city}&lab=${lab.lab_name}`)}
                                className="group relative overflow-hidden bg-black/40 border-white/5 backdrop-blur-3xl cursor-pointer hover:border-primary/50 transition-all hover:scale-[1.02]"
                            >
                                <CardContent className="p-8 space-y-6">
                                    <div className="flex items-start justify-between relative">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 rounded-2xl bg-white/5 text-primary">
                                                <Building2 size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white group-hover:text-primary transition-colors">
                                                    {lab.lab_name}
                                                </h2>
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Facility Environment</p>
                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white">
                                                    <MoreVertical size={20} />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-black/90 border-white/10 backdrop-blur-xl">
                                                <DropdownMenuItem onClick={(e) => handleRenameLab(e, lab.lab_name)} className="gap-2 text-white hover:bg-white/10 cursor-pointer">
                                                    <Edit2 size={14} /> Rename Lab
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => handleDeleteLab(e, lab.lab_name)} className="gap-2 text-red-500 hover:bg-red-500/10 cursor-pointer">
                                                    <Trash2 size={14} /> Delete Lab
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* PC Availability Graph */}
                                    <div className="h-24 w-full relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={graphData}>
                                                <Line
                                                    type="monotone"
                                                    dataKey="val"
                                                    stroke="#22c55e"
                                                    strokeWidth={3}
                                                    dot={{ fill: '#22c55e', r: 4 }}
                                                />
                                                <Tooltip
                                                    contentStyle={{ background: '#000', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }}
                                                    itemStyle={{ color: '#22c55e' }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-center">
                                            <span className="block text-[8px] font-bold text-muted-foreground uppercase">Hosts</span>
                                            <span className="text-sm font-black text-white">{lab.total_pcs}</span>
                                        </div>
                                        <div className="p-2 rounded-lg bg-success/5 border border-success/10 text-center">
                                            <span className="block text-[8px] font-bold text-success uppercase">Active</span>
                                            <span className="text-sm font-black text-success">{lab.online}</span>
                                        </div>
                                        <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/10 text-center">
                                            <span className="block text-[8px] font-bold text-red-500 uppercase">Idle</span>
                                            <span className="text-sm font-black text-red-500">{lab.offline}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex justify-end">
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-primary italic opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                            ACCESS TERMINALS <ArrowRight size={12} />
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
