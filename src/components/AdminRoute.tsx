import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * AdminRoute strictly prevents Sub-Admins from accessing sensitive 
 * architectural tools like Terminal, OTA Hub, and User Management.
 */
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-slate-950 text-blue-500 font-mono">ENFORCING SECURITY POLICIES...</div>;
  }

  if (!user || user.role !== 'ADMIN') {
    console.warn(`[SECURITY] Unauthorized access attempt to AdminRoute by ${user?.email || 'Anonymous'}. Redirecting to safety.`);
    return <Navigate to="/dashboard/overview" replace />;
  }

  return <>{children}</>;
};
