import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export function usePCDisks() {
  const [disks, setDisks] = useState<Tables<'pc_disks'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDisks() {
      try {
        const { data, error } = await supabase
          .from('pc_disks')
          .select('*')
          .order('disk_name');
        
        if (error) throw error;
        setDisks(data || []);
      } finally {
        setLoading(false);
      }
    }

    fetchDisks();

    // Realtime subscription
    const channel = supabase
      .channel('pc_disks_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pc_disks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDisks(prev => [...prev, payload.new as Tables<'pc_disks'>]);
          } else if (payload.eventType === 'UPDATE') {
            setDisks(prev => 
              prev.map(d => d.id === payload.new.id ? payload.new as Tables<'pc_disks'> : d)
            );
          } else if (payload.eventType === 'DELETE') {
            setDisks(prev => prev.filter(d => d.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getDisksByPCId = (pcId: string) => disks.filter(d => d.pc_id === pcId);

  return { disks, loading, getDisksByPCId };
}
