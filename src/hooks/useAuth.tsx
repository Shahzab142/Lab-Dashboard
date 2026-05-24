/**
 * ----------------------------------------------------------------------------------
 * @file useAuth.tsx
 * @description Authentication context and state management for the Lab Dashboard.
 *
 * @architecture
 * - Manages the global authentication state via React Context API.
 * - Handles login by communicating with the Go backend (`/api/admin/login`).
 * - Implements persistent sessions using `localStorage` (`lab_guardian_admin`, `lab_guardian_token`).
 *
 * @rbac_flow (Role-Based Access Control)
 * - The backend returns an admin object containing `role`, `scope_type`, and `scope_values`.
 * - `role`: Can be 'SUPER_ADMIN' (full access) or 'SUB_ADMIN' (restricted access).
 * - `scope_type`: For SUB_ADMINs, dictates the level of access ('DISTRICT', 'TEHSIL', or 'LAB').
 * - `scope_values`: Array of specific IDs (e.g., city names, lab IDs) the user is allowed to manage.
 * - This context provides these details to the routing logic in `App.tsx` and data fetching components.
 * ----------------------------------------------------------------------------------
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: any; // Simplified user object
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for persistent session
    const savedUser = localStorage.getItem('lab_guardian_admin');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "https://labmonitoringservergo-1f69d6677862.herokuapp.com/api";
      const res = await fetch(`${baseUrl}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        return { error: new Error(errData.error || 'Access Denied') };
      }

      const data = await res.json();
      
      // Login success
      const adminUser = { 
        id: data.user_id, 
        email: email, 
        full_name: data.full_name,
        role: data.role,
        scope_type: data.scope_type,
        scope_values: data.scope_values,
        token: data.token
      };
      
      setUser(adminUser);
      localStorage.setItem('lab_guardian_admin', JSON.stringify(adminUser));
      localStorage.setItem('lab_guardian_token', data.token);

      return { error: null };
    } catch (err) {
      return { error: new Error('Backend server is unreachable') };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('lab_guardian_admin');
    localStorage.removeItem('lab_guardian_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

