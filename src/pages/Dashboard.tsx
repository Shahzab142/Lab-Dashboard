import { Outlet } from 'react-router-dom';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen flex w-full bg-background">
      <DashboardSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={isMobile} />
      <main className={`flex-1 overflow-auto transition-all duration-300 ${!isMobile && sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="pl-14 md:pl-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
