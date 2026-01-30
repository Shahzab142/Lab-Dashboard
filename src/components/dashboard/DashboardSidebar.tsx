import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Monitor, LogOut, Menu, X, Globe, ShieldCheck, Beaker, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/dashboard/lab-analytics', icon: Beaker, label: 'LAB DASHBOARD', color: 'emerald' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'TOTAL CITY', color: 'blue' },
  { to: '/dashboard/cities', icon: Globe, label: 'CITY WISE SYSTEM', color: 'purple' },
  { to: '/dashboard/devices', icon: Monitor, label: 'TOTAL SYSTEM', color: 'rose' },
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

  const getColorClasses = (color: string) => {
    const variants: Record<string, any> = {
      emerald: {
        active: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]',
        hover: 'hover:bg-emerald-500/5 hover:text-emerald-400',
        icon: 'text-emerald-500',
        indicator: 'bg-emerald-500 shadow-[0_0_15px_#10b981]'
      },
      blue: {
        active: 'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]',
        hover: 'hover:bg-blue-500/5 hover:text-blue-400',
        icon: 'text-blue-500',
        indicator: 'bg-blue-500 shadow-[0_0_15px_#3b82f6]'
      },
      purple: {
        active: 'text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]',
        hover: 'hover:bg-purple-500/5 hover:text-purple-400',
        icon: 'text-purple-500',
        indicator: 'bg-purple-500 shadow-[0_0_15px_#8b5cf6]'
      },
      rose: {
        active: 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[inset_0_0_20px_rgba(244,63,94,0.1)]',
        hover: 'hover:bg-rose-500/5 hover:text-rose-400',
        icon: 'text-rose-500',
        indicator: 'bg-rose-500 shadow-[0_0_15px_#f43f5e]'
      }
    };
    return variants[color] || variants.blue;
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
          'fixed top-0 left-0 h-screen bg-[#050505]/95 backdrop-blur-3xl border-r border-white/5 flex flex-col z-40',
          'transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)',
          isOpen ? 'w-64 translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-10">
            <NavLink to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/10 flex items-center justify-center shrink-0 border border-white/10 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div className="overflow-hidden">
                <h1 className="font-black text-xl text-white italic tracking-tighter uppercase font-display leading-tight">LAB <span className="text-primary text-glow-blue">GUARDIAN</span></h1>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mt-0.5 whitespace-nowrap">V2.0 PRO INFRA</p>
              </div>
            </NavLink>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="shrink-0 hover:bg-white/5 rounded-xl w-9 h-9 border border-transparent hover:border-white/10 transition-all"
            >
              <X className="w-4 h-4 text-white/40" />
            </Button>
          </div>

          <nav className="space-y-4">
            {navItems.map(({ to, icon: Icon, label, color }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                onClick={handleNavClick}
                className={({ isActive }) => {
                  const style = getColorClasses(color);
                  return cn(
                    'group relative flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500',
                    'border border-transparent',
                    isActive ? style.active : cn('text-white/40', style.hover)
                  );
                }}
              >
                {({ isActive }) => {
                  const style = getColorClasses(color);
                  return (
                    <>
                      <Icon className={cn(
                        "w-5 h-5 shrink-0 transition-all duration-500",
                        isActive ? style.icon + " scale-110" : "group-hover:" + style.icon + " group-hover:scale-110"
                      )} />
                      <span className={cn(
                        "whitespace-nowrap italic transition-all duration-500",
                        isActive ? "translate-x-1" : "group-hover:translate-x-1"
                      )}>
                        {label}
                      </span>
                      {isActive && (
                        <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-r-full", style.indicator)} />
                      )}
                    </>
                  );
                }}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xl">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-3">Core Connection</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_#10b981]" />
                <span className="text-[10px] font-black text-white/80 uppercase italic tracking-widest">ENCRYPTED</span>
              </div>
              <Activity className="w-3 h-3 text-white/20" />
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] text-red-500/80 hover:text-red-500 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 transition-all duration-500 group italic"
          >
            <LogOut className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-1" />
            <span>Terminate</span>
          </button>
        </div>
      </aside>
    </>
  );
}