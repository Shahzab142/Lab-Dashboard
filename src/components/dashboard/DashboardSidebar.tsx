import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Monitor, LogOut, Menu, X, Globe, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'COMMAND CENTER' },
  { to: '/dashboard/cities', icon: Globe, label: 'REGIONAL NODES' },
  { to: '/dashboard/devices', icon: Monitor, label: 'SYSTEM FLEET' },
];

interface DashboardSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
}

export function DashboardSidebar({ isOpen, setIsOpen, isMobile }: DashboardSidebarProps) {
  const { signOut } = useAuth();

  const handleNavClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className={cn(
            'fixed top-6 left-6 z-50',
            'bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl',
            'hover:bg-primary/20 transition-all duration-300 shadow-2xl group'
          )}
        >
          <Menu className="w-5 h-5 group-hover:text-primary" />
        </Button>
      )}

      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-screen bg-[#0a0a0a] border-r border-white/5 flex flex-col z-40',
          'transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)',
          isOpen ? 'w-72 translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <NavLink to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center shrink-0 border border-white/5 glow-pink">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div className="overflow-hidden">
                <h1 className="font-black text-xl text-white italic tracking-tighter uppercase font-display leading-tight">LAB <span className="text-primary text-glow-pink">GUARDIAN</span></h1>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-0.5">V2.0 PRO AGENT</p>
              </div>
            </NavLink>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="shrink-0 hover:bg-white/5 rounded-xl"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="space-y-2">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300',
                    'hover:translate-x-2',
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20 glow-pink'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent'
                  )
                }
              >
                <Icon className={cn("w-5 h-5 shrink-0", "transition-colors")} />
                <span className="whitespace-nowrap italic">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5 bg-gradient-to-b from-transparent to-primary/5">
          <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Network Layer</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse-cyan shadow-[0_0_10px_#22c55e]" />
              <span className="text-[10px] font-bold text-white uppercase italic">Active Nodes Online</span>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-pink-500 hover:bg-pink-500/10 border border-transparent hover:border-pink-500/20 transition-all group italic"
          >
            <LogOut className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}