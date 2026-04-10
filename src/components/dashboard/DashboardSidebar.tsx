import { NavLink } from 'react-router-dom';
import { useRef, useState } from 'react';
import { LayoutDashboard, Monitor, LogOut, Menu, X, Globe, ShieldCheck, Beaker, Activity, TrendingUp, Camera, Bell, Map, FileText, Terminal, Wrench, Grid3X3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GeneratePDFDialog } from './GeneratePDFDialog';

const navItems = [
  { to: '/dashboard/analytics', icon: LayoutDashboard, label: 'DASHBOARD' },
  { to: '/dashboard/overview', icon: LayoutDashboard, label: 'DISTRICTWISE' },
  { to: '/dashboard/cities', icon: Globe, label: 'TEHSILWISE LAB' },
  { to: '/dashboard/labs', icon: Monitor, label: 'LABWISE SYSTEM' },
];

interface DashboardSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
}

export function DashboardSidebar({ isOpen, setIsOpen, isMobile }: DashboardSidebarProps) {
  const { user, signOut } = useAuth();

  // State for user-uploaded custom avatar from their desktop
  const [localAvatar, setLocalAvatar] = useState<string | null>(() => {
    return localStorage.getItem('local_admin_avatar');
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Logic to determine admin name and image
  const adminName = user?.email ? user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ') : "System Admin";
  // Capitalize the first letter of each word to make it professional
  const formattedName = adminName.replace(/\b\w/g, (char: string) => char.toUpperCase());

  // High-priority local override -> DB URL -> Professional fallback
  const adminImage = localAvatar || user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedName)}&background=8B5CF6&color=fff&size=200`;

  // File upload handler
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLocalAvatar(base64String);
        localStorage.setItem('local_admin_avatar', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

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
            'bg-card border border-border rounded-lg shadow-lg',
            'hover:bg-primary transition-all duration-300 group'
          )}
        >
          <Menu className="w-5 h-5 group-hover:text-black text-white" />
        </Button>
      )}

      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-screen bg-card border-r border-border flex flex-col z-40',
          'transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl',
          isOpen ? 'w-64 translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="pt-4 pb-0">
          {/* Logo Section */}
          <div className="relative flex items-center justify-center mb-4">
            <h1 className="font-black text-xl text-white tracking-widest uppercase">Lab Monitoring</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="absolute right-3 shrink-0 hover:bg-white/10 rounded-lg w-8 h-8 transition-all md:hidden"
            >
              <X className="w-4 h-4 text-white" />
            </Button>
          </div>

          {/* Admin Profile Section */}
          <div className="flex flex-col items-center justify-center mb-2">
            <div
              className="w-20 h-20 rounded-full shadow-lg mb-2 relative group transition-transform hover:scale-105 duration-300 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <div className="w-full h-full rounded-full bg-card overflow-hidden relative flex items-center justify-center group-hover:brightness-90 transition-all">
                <img
                  src={adminImage}
                  alt={formattedName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initial image if URL fails
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop";
                  }}
                />

                {/* Upload Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full backdrop-blur-[1px]">
                  <Camera className="w-5 h-5 text-white/90 drop-shadow-md" />
                </div>
              </div>
            </div>
            <h2 className="text-white font-bold tracking-wide text-sm leading-none text-center">
              {formattedName}
            </h2>
          </div>
        </div>

        <ScrollArea className="flex-1 px-2">
          <nav className="space-y-0 py-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                onClick={handleNavClick}
                className={({ isActive }) => cn(
                  'group relative flex items-center justify-start gap-4 px-6 py-2.5 rounded-xl w-full text-[11px] font-bold transition-all duration-300',
                  isActive
                    ? 'bg-primary text-black shadow-[0_0_15px_rgba(249,154,29,0.4)] scale-[1.02]'
                    : 'text-white hover:text-primary hover:bg-primary/10'
                )}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn(
                      "w-[18px] h-[18px] shrink-0 transition-transform duration-300",
                      isActive ? "scale-110" : "group-hover:scale-110"
                    )} />
                    <span className="whitespace-nowrap tracking-wide">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </ScrollArea>

        <div className="mt-auto p-2 pt-0 space-y-1.5">
          <div className="p-2.5 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">System Status</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[9px] font-bold opacity-80 uppercase tracking-widest text-emerald-500">Connected</span>
              </div>
            </div>
          </div>

          <GeneratePDFDialog />

          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 rounded-xl text-xs font-black text-black bg-primary hover:bg-primary/90 transition-all duration-300 shadow-xl group border border-primary/20"
          >
            <LogOut className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-1" />
            <span>SIGN OUT</span>
          </button>
        </div>
      </aside>
    </>
  );
}
