import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Monitor, MapPin, Beaker, ShieldCheck, ArrowRight, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface DeviceCardProps {
  device: any;
}

export function DeviceCard({ device }: DeviceCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleRenamePC = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = prompt("Enter new PC name:", device.pc_name);
    if (!newName || newName === device.pc_name) return;

    try {
      await apiFetch(`/devices/${device.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ pc_name: newName })
      });
      toast.success("PC renamed successfully");
      queryClient.invalidateQueries({ queryKey: ['devices-list'] });
    } catch (err) {
      toast.error("Failed to rename PC");
    }
  };

  const handleDeletePC = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${device.pc_name}?`)) return;

    try {
      await apiFetch(`/devices/manage?hid=${device.id}`, { method: 'DELETE' });
      toast.success("PC deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['devices-list'] });
    } catch (err) {
      toast.error("Failed to delete PC");
    }
  };

  // Robust Online Check: status must be 'online' AND last_seen must be within 40 seconds
  const lastSeenDate = device.last_seen ? new Date(device.last_seen) : null;
  const isOnline = device.status === 'online' &&
    lastSeenDate &&
    (new Date().getTime() - lastSeenDate.getTime() < 40 * 1000);

  // Helper for Last Active Time
  const lastActiveText = lastSeenDate ?
    new Intl.DateTimeFormat('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(lastSeenDate) : 'Never';

  return (
    <Card
      onClick={() => navigate(`/dashboard/pc/${device.id}`)}
      className={cn(
        "group relative overflow-hidden transition-all cursor-pointer border-white/5 bg-black/40 backdrop-blur-xl hover:border-primary/50 hover:scale-[1.02] shadow-xl",
        isOnline ? "ring-1 ring-success/20" : ""
      )}
    >
      {/* Status indicator line */}
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full transition-colors",
        isOnline ? "bg-success shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-muted-foreground/30"
      )} />

      <div className="p-5 space-y-4">
        {/* Header: Name and Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isOnline ? "bg-primary/10 text-primary" : "bg-muted/10 text-muted-foreground"
            )}>
              <Monitor size={18} />
            </div>
            <div>
              <h3 className="font-black italic text-md tracking-tight group-hover:text-primary transition-colors">
                {device.pc_name || "UNKNOWN_STATION"}
              </h3>
              <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-tighter">
                AUTH_HID: {device.id?.slice(0, 12)}...
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
              isOnline ? "bg-success/20 text-success" : "bg-red-500/10 text-red-500"
            )}>
              {isOnline ? "Live" : "Offline"}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="p-1 hover:bg-white/10 rounded transition-colors text-muted-foreground hover:text-white">
                  <MoreVertical size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/90 border-white/10 backdrop-blur-xl">
                <DropdownMenuItem onClick={handleRenamePC} className="gap-2 text-white hover:bg-white/10 cursor-pointer">
                  <Edit2 size={12} /> Rename PC
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeletePC} className="gap-2 text-red-500 hover:bg-red-500/10 cursor-pointer">
                  <Trash2 size={12} /> Delete PC
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Details List */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
            <MapPin size={12} className="text-primary" />
            <span className="text-[10px] font-bold text-white uppercase truncate">
              {device.city || 'N/A'} / {device.lab_name || 'N/A'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1">
            <span>Status</span>
            <span className={isOnline ? "text-success" : "text-white"}>
              {isOnline ? "Active Now" : `Last Active: ${lastActiveText}`}
            </span>
          </div>
        </div>

        {/* Score & Security Status */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Compute Units</span>
            <span className={cn(
              "text-lg font-black italic text-primary"
            )}>
              {device.cpu_score || 0}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-bold text-primary italic opacity-0 group-hover:opacity-100 transition-opacity">
            DEPLOY ANALYTICS <ArrowRight size={10} />
          </div>
        </div>
      </div>
    </Card>
  );
}