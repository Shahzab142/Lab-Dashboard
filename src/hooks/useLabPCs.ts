import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export function useLabPCs() {
  const [devices, setDevices] = useState<Tables<'lab_pcs'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchDevices() {
      try {
        const { data, error } = await supabase
          .from('lab_pcs')
          .select('*')
          .order('hostname');
        
        if (error) throw error;
        setDevices(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch devices'));
      } finally {
        setLoading(false);
      }
    }

    fetchDevices();

    // Set up realtime subscription
    const channel = supabase
      .channel('lab_pcs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lab_pcs'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDevices(prev => [...prev, payload.new as Tables<'lab_pcs'>]);
          } else if (payload.eventType === 'UPDATE') {
            setDevices(prev => 
              prev.map(d => d.id === payload.new.id ? payload.new as Tables<'lab_pcs'> : d)
            );
          } else if (payload.eventType === 'DELETE') {
            setDevices(prev => prev.filter(d => d.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onlineCount = devices.filter(d => d.status === 'online').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;

  return { devices, loading, error, onlineCount, offlineCount, totalCount: devices.length };
}
