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

        // Map duration_seconds to duration_minutes if needed
        const mappedData = (data || []).map((session: any) => ({
          ...session,
          duration_minutes: session.duration_minutes || (session.duration_seconds ? Math.floor(session.duration_seconds / 60) : null)
        }));

        setSessions(mappedData);

        // Build active sessions map (sessions without end_time)
        // Only keep the most recent session per device
        const activeMap = new Map<string, string>();
        const processedDevices = new Set<string>();

        mappedData.forEach(session => {
          const deviceId = session.pc_id || session.mac_address;
          if (deviceId && !session.end_time && !processedDevices.has(deviceId)) {
            activeMap.set(deviceId, session.start_time);
            processedDevices.add(deviceId);
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

    const pollingTimer = setInterval(fetchSessions, 30000);

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
        () => {
          console.log('Realtime Session update received');
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollingTimer);
    };
  }, []);

  // Count sessions that started today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySessionsCount = sessions.filter(s => new Date(s.start_time) >= today).length;

  return { sessions, activeSessions, loading, error, todaySessionsCount };
}
