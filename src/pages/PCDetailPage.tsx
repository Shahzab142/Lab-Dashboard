import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import {
  ArrowLeft,
  Monitor,
  HardDrive,
  Activity,
  ShieldCheck,
  Cpu,
  MapPin,
  Beaker,
  Clock,
  Calendar,
  Sunrise,
  Timer,
  Save,
  X,
  Edit3,
  Trash2,
  Power,
  PowerOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function PCDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ pc_name: '', city: '', lab_name: '' });

  const { data: detail, isLoading } = useQuery({
    queryKey: ['pc-detail', id],
    queryFn: () => apiFetch(`/devices/${id}`),
    refetchInterval: isEditing ? false : 30000
  });

  useEffect(() => {
    if (detail?.device) {
      setEditData({
        pc_name: detail.device.pc_name,
        city: detail.device.city,
        lab_name: detail.device.lab_name
      });
    }
  }, [detail]);

  const deleteMutation = useMutation({
    mutationFn: () => apiFetch(`/devices/manage?hid=${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success("System de-registered successfully");
      navigate('/dashboard');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiFetch(`/devices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pc-detail', id] });
      setIsEditing(false);
      toast.success("System identity updated");
    }
  });

  if (isLoading) return <div className="p-8"><Skeleton className="h-screen rounded-3xl" /></div>;
  if (!detail?.device) return <div className="p-8 text-center text-white">System Not Found</div>;

  const { device, history } = detail;

  // Robust Online Check: 40 second threshold
  const isOnline = (() => {
    const lastSeenDate = device.last_seen ? new Date(device.last_seen) : null;
    return device.status === 'online' &&
      lastSeenDate &&
      (new Date().getTime() - lastSeenDate.getTime() < 40 * 1000);
  })();

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in zoom-in-95 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              {isEditing ? (
                <Input
                  className="text-2xl font-black italic tracking-tighter uppercase bg-black/40 border-primary text-white"
                  value={editData.pc_name}
                  onChange={(e) => setEditData({ ...editData, pc_name: e.target.value })}
                />
              ) : (
                <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white">{device.pc_name}</h1>
              )}
              <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isOnline ? 'bg-success/20 text-success' : 'bg-red-500/10 text-red-500'}`}>
                {isOnline ? "Live" : "Offline"}
              </div>
            </div>
            <p className="text-muted-foreground font-mono text-xs mt-1 uppercase tracking-tighter">Hardware Auth ID: {device.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="font-bold">
                <X className="w-4 h-4 mr-2" /> CANCEL
              </Button>
              <Button variant="default" size="sm" onClick={() => updateMutation.mutate(editData)} className="bg-primary hover:bg-primary/80 text-white font-bold">
                <Save className="w-4 h-4 mr-2" /> SAVE CHANGES
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="bg-white/5 border-white/10 hover:bg-white/10 font-bold">
                <Edit3 className="w-4 h-4 mr-2" /> EDIT IDENTITY
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-bold"
                onClick={() => {
                  if (window.confirm("CRITICAL: De-register this hardware from the network?")) deleteMutation.mutate();
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" /> DELETE SYSTEM
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registry Sidecard */}
        <div className="space-y-6">
          <Card className="bg-black/40 border-white/5 backdrop-blur-3xl">
            <CardHeader>
              <CardTitle className="text-xs font-bold tracking-widest text-primary uppercase">Registry Intelligence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 text-white">
                <MapPin className="text-primary w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Region</p>
                  {isEditing ? (
                    <Input className="mt-1 bg-black/40 border-primary text-xs" value={editData.city} onChange={(e) => setEditData({ ...editData, city: e.target.value })} />
                  ) : (
                    <p className="font-bold text-sm">{device.city}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 text-white">
                <Beaker className="text-purple-500 w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Laboratory</p>
                  {isEditing ? (
                    <Input className="mt-1 bg-black/40 border-primary text-xs" value={editData.lab_name} onChange={(e) => setEditData({ ...editData, lab_name: e.target.value })} />
                  ) : (
                    <p className="font-bold text-sm">{device.lab_name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 text-white">
                <Sunrise className="text-orange-500 w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">First Boot (Today)</p>
                  <p className="font-black text-2xl text-white">
                    {device.today_start_time ? new Date(device.today_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 text-white">
                <Timer className="text-primary w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Daily Runtime</p>
                  <p className="font-black text-2xl text-white">
                    {(() => {
                      if (!device.today_start_time || !device.today_last_active) return '0h 0m';
                      const start = new Date(device.today_start_time).getTime();
                      const end = new Date(device.today_last_active).getTime();
                      const diffMs = end - start;
                      if (diffMs < 0) return '0h 0m';
                      const hours = Math.floor(diffMs / (1000 * 3600));
                      const minutes = Math.floor((diffMs % (1000 * 3600)) / (1000 * 60));
                      return `${hours}h ${minutes}m`;
                    })()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 text-white">
                <Clock className="text-primary w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Session Presence</p>
                  <p className={cn(
                    "font-black text-2xl uppercase italic",
                    isOnline ? "text-success" : "text-white"
                  )}>
                    {isOnline ? "Active Now" : (device.last_seen ? new Date(device.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 text-white">
                <Activity className="text-primary w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Compute Units</p>
                  <p className="font-black text-2xl text-primary">{device.cpu_score}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "border-dashed",
            isOnline ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
          )}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Session Status</p>
                {isOnline ? <Power className="text-green-500 w-4 h-4" /> : <PowerOff className="text-red-500 w-4 h-4" />}
              </div>

              {isOnline ? (
                <div className="space-y-1">
                  <p className="text-2xl font-black italic text-green-500 uppercase">Active Now</p>
                  <p className="text-xs text-muted-foreground font-bold">Started at {device.today_start_time ? new Date(device.today_start_time).toLocaleTimeString() : 'N/A'}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-2xl font-black italic text-red-500 uppercase">Offline</p>
                  <p className="text-xs text-muted-foreground font-bold italic">Last active at {device.today_last_active ? new Date(device.today_last_active).toLocaleString() : 'N/A'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* History Main Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-black/40 border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold tracking-widest text-white uppercase">System Session History</CardTitle>
              <Calendar className="text-muted-foreground/30 w-5 h-5" />
            </CardHeader>
            <CardContent>
              {history && history.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-bold uppercase text-muted-foreground">
                        <th className="pb-4">Date</th>
                        <th className="pb-4">Login</th>
                        <th className="pb-4">Logout</th>
                        <th className="pb-4">Region/Lab</th>
                        <th className="pb-4">Score</th>
                        <th className="pb-4">Runtime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {history.map((h: any) => {
                        const dateObj = h.history_date ? new Date(h.history_date) : new Date(h.start_time);
                        const start = new Date(h.start_time);
                        const end = h.end_time ? new Date(h.end_time) : null;

                        // Use runtime_minutes from DB if available, else calculate
                        const runtimeTotalMins = h.runtime_minutes || (end ? Math.floor((end.getTime() - start.getTime()) / 1000 / 60) : 0);

                        return (
                          <tr key={h.id || h.history_date} className="text-xs text-white group">
                            <td className="py-4 font-bold">{dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                            <td className="py-4 text-muted-foreground">{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="py-4 text-muted-foreground">
                              {end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                            </td>
                            <td className="py-4">
                              <div className="flex flex-col">
                                <span className="text-primary font-bold">{h.city || 'N/A'}</span>
                                <span className="text-[10px] text-muted-foreground">{h.lab_name || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className={cn(
                                "font-black italic px-2 py-0.5 rounded",
                                h.avg_score > 0 ? "bg-primary/20 text-primary" : "bg-orange-500/20 text-orange-500"
                              )}>
                                {h.avg_score || 0} UNITS
                              </span>
                            </td>
                            <td className="py-4 font-mono text-primary font-bold">
                              {runtimeTotalMins > 0 ? `${Math.floor(runtimeTotalMins / 60)}h ${runtimeTotalMins % 60}m` : "---"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                  <Activity className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest">Initial Session Gathering...</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <ShieldCheck className="text-primary w-8 h-8" />
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Network Compliance</p>
                  <p className="text-xs text-white mt-1">This node is running on a secured local network with verified hardware authentication.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}