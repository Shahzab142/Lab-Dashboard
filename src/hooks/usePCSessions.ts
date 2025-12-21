import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

interface SessionWithPC extends Tables<'pc_sessions'> {
  lab_pcs?: Tables<'lab_pcs'> | null;
}

export function usePCSessions() {
  const [sessions, setSessions] = useState<SessionWithPC[]>([]);
  const [activeSessions, setActiveSessions] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const { data, error } = await supabase
          .from('pc_sessions')
          .select('*, lab_pcs(*)')
          .order('start_time', { ascending: false })
          .limit(100);
        
        if (error) throw error;
        setSessions(data || []);

        // Build active sessions map (sessions without end_time)
        const activeMap = new Map<string, string>();
        (data || []).forEach(session => {
          if (!session.end_time) {
            activeMap.set(session.pc_id, session.start_time);
          }
        });
        setActiveSessions(activeMap);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch sessions'));
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();

    // Set up realtime subscription
    const channel = supabase
      .channel('pc_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pc_sessions'
        },
        async (payload) => {
          // Refetch to get the joined data
          const { data } = await supabase
            .from('pc_sessions')
            .select('*, lab_pcs(*)')
            .order('start_time', { ascending: false })
            .limit(100);
          
          if (data) {
            setSessions(data);
            const activeMap = new Map<string, string>();
            data.forEach(session => {
              if (!session.end_time) {
                activeMap.set(session.pc_id, session.start_time);
              }
            });
            setActiveSessions(activeMap);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Count sessions that started today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySessionsCount = sessions.filter(s => new Date(s.start_time) >= today).length;

  return { sessions, activeSessions, loading, error, todaySessionsCount };
}
