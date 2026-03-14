import { useState, useEffect } from "react";
import { Wrench, CheckCircle2, Clock, AlertTriangle, AlertCircle, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { apiFetch } from "@/lib/api";

type Ticket = {
    id: string;
    system_id: string;
    pc_name: string;
    lab: string;
    city: string;
    status: 'pending' | 'in-progress' | 'resolved';
    priority: 'high' | 'medium' | 'low';
    created_at: string;
};

export default function MaintenanceHub() {
    const [tickets, setTickets] = useState<Ticket[]>([]);

    useEffect(() => {
        const generateMockTickets = async () => {
            // Get defective devices to seed the ticket system
            const defectiveIds = JSON.parse(localStorage.getItem('defective_devices') || '[]');
            try {
                const res = await apiFetch("/devices");
                const allDevices = res.devices || [];

                let initialTickets: Ticket[] = defectiveIds.map((id: string, index: number) => {
                    const device = allDevices.find((d: any) => d.system_id === id);
                    return {
                        id: `TKT-${Math.floor(Math.random() * 90000) + 10000}`,
                        system_id: id,
                        pc_name: device?.pc_name || `Unknown Node`,
                        lab: device?.lab_name || 'Unassigned Lab',
                        city: device?.city || 'Unknown District',
                        status: index % 3 === 0 ? 'in-progress' : 'pending',
                        priority: 'high',
                        created_at: new Date(Date.now() - (Math.random() * 100000000)).toISOString()
                    };
                });

                // Add some dummy offline ones
                const offline = allDevices.filter((d: any) => d.status === 'offline').slice(0, 3);
                offline.forEach((d: any) => {
                    if (!initialTickets.find(t => t.system_id === d.system_id)) {
                        initialTickets.push({
                            id: `TKT-${Math.floor(Math.random() * 90000) + 10000}`,
                            system_id: d.system_id,
                            pc_name: d.pc_name || 'Station',
                            lab: d.lab_name,
                            city: d.city,
                            status: 'pending',
                            priority: 'medium',
                            created_at: new Date().toISOString()
                        });
                    }
                });

                setTickets(initialTickets);
            } catch (err) {
                console.error(err);
            }
        };

        generateMockTickets();
    }, []);

    const columns: { id: 'pending' | 'in-progress' | 'resolved'; title: string; icon: any; color: string }[] = [
        { id: 'pending', title: 'Awaiting Action', icon: AlertCircle, color: 'text-red-400 border-red-500/20 bg-red-500/5' },
        { id: 'in-progress', title: 'In Maintenance', icon: Clock, color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' },
        { id: 'resolved', title: 'Resolved & Verified', icon: CheckCircle2, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' }
    ];

    const onDragEnd = (result: any) => {
        if (!result.destination) return;

        const { source, destination } = result;
        if (source.droppableId !== destination.droppableId) {
            setTickets(prev => prev.map(t => {
                if (t.id === result.draggableId) {
                    return { ...t, status: destination.droppableId as any };
                }
                return t;
            }));

            // If moved to resolved, optionally remove from defective
            if (destination.droppableId === 'resolved') {
                const ticket = tickets.find(t => t.id === result.draggableId);
                if (ticket) {
                    const defectiveIds = JSON.parse(localStorage.getItem('defective_devices') || '[]');
                    const newDefective = defectiveIds.filter((id: string) => id !== ticket.system_id);
                    localStorage.setItem('defective_devices', JSON.stringify(newDefective));
                }
            }
        }
    };

    return (
        <div className="p-4 md:p-8 min-h-[calc(100vh-2rem)] animate-in fade-in duration-700 bg-background text-foreground">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase text-white font-display flex items-center gap-3">
                        <Wrench className="text-secondary w-8 h-8" />
                        Maintenance <span className="text-secondary">Dispatch Hub</span>
                    </h1>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mt-1">Automated Infrastructure Ticketing System</p>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {columns.map(col => (
                        <div key={col.id} className="flex flex-col h-[75vh]">
                            <div className={`p-4 rounded-t-2xl border-t border-l border-r border-b-0 flex items-center justify-between ${col.color}`}>
                                <div className="flex items-center gap-2">
                                    <col.icon className="w-5 h-5" />
                                    <h2 className="font-black text-xs tracking-widest uppercase">{col.title}</h2>
                                </div>
                                <div className="px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-bold">
                                    {tickets.filter(t => t.status === col.id).length}
                                </div>
                            </div>

                            <Droppable droppableId={col.id}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex-1 p-4 rounded-b-2xl border-b border-l border-r border-t-0 bg-muted/20 overflow-y-auto space-y-3 ${col.color.split(' ')[1]}`}
                                    >
                                        {tickets.filter(t => t.status === col.id).map((ticket, index) => (
                                            <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <Card
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`p-4 bg-card border-border shadow-lg cursor-grab active:cursor-grabbing hover:border-white/20 transition-colors ${snapshot.isDragging ? 'rotate-2 scale-105 ring-2 ring-primary/50' : ''}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="space-y-1">
                                                                <span className="text-[9px] font-black text-primary uppercase tracking-widest">{ticket.id}</span>
                                                                <h3 className="text-xs font-bold text-white">{ticket.pc_name}</h3>
                                                            </div>
                                                            {ticket.priority === 'high' && <Badge variant="destructive" className="h-5 text-[8px] uppercase font-bold tracking-wider">Critical</Badge>}
                                                            {ticket.priority === 'medium' && <Badge variant="outline" className="h-5 text-[8px] uppercase font-bold tracking-wider border-amber-500 text-amber-500">Warning</Badge>}
                                                        </div>
                                                        <div className="space-y-1 mt-3">
                                                            <div className="flex items-center gap-2 text-[10px] text-white/60">
                                                                <span className="font-bold uppercase tracking-widest opacity-50">Facility:</span>
                                                                <span className="truncate">{ticket.lab}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] text-white/60">
                                                                <span className="font-bold uppercase tracking-widest opacity-50">District:</span>
                                                                <span className="truncate">{ticket.city}</span>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                                                            <span className="text-[8px] font-mono text-white/30">{new Date(ticket.created_at).toLocaleDateString()}</span>
                                                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                                                <Wrench className="w-3 h-3 text-primary" />
                                                            </div>
                                                        </div>
                                                    </Card>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
