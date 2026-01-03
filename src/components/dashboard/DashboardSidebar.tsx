import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Monitor, LogOut, Menu, X, Globe, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/locations', icon: Globe, label: 'Locations' },
  { to: '/dashboard/devices', icon: Monitor, label: 'Systems' },
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
      {/* Toggle Button - Only visible when sidebar is closed */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className={cn(
            'fixed top-4 left-4 z-50',
            'bg-sidebar/80 backdrop-blur-xl border border-sidebar-border',
            'hover:bg-sidebar-accent transition-all duration-300'
          )}
        >
          <Menu className="w-5 h-5" />
        </Button>
      )}

      {/* Backdrop for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Fixed position */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-40',
          'transition-all duration-300 ease-in-out',
          isOpen ? 'w-64 translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <NavLink to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Monitor className="w-5 h-5 text-primary" />
              </div>
              <div className="overflow-hidden">
                <h1 className="font-bold text-lg text-sidebar-foreground whitespace-nowrap">Lab Monitor</h1>
                <p className="text-xs text-muted-foreground whitespace-nowrap">IT Infrastructure</p>
              </div>
            </NavLink>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="shrink-0 hover:bg-sidebar-accent"
            >

              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <nav className={cn(
          'flex-1 px-3 space-y-1 transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                  'hover:scale-[1.02] active:scale-[0.98]',
                  isActive
                    ? 'bg-sidebar-accent text-primary'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Logout Section */}
        <div className={cn(
          "p-4 border-t border-sidebar-border transition-opacity duration-200",
          isOpen ? 'opacity-100' : 'opacity-0'
        )}>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="whitespace-nowrap">Logout</span>
          </button>
        </div>

      </aside>
    </>
  );
}