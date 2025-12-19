import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export interface DeviceWithMetrics extends Tables<'lab_pcs'> {
  cpu_usage?: number;
  cpu_score?: number;
  ram_usage_pct?: number;
  is_online_local?: boolean;
}

export function useLabPCs() {
  const [devices, setDevices] = useState<DeviceWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [now, setNow] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const { data: pcs, error: pcError } = await supabase
        .from('lab_pcs')
        .select('*')
        .order('hostname');

      if (pcError) throw pcError;

      const { data: metrics } = await (supabase
        .from('pc_metrics' as any)
        .select('*')
        .order('id', { ascending: false })
        .limit(100) as any);

      const devicesWithStats = (pcs || []).map(pc => {
        // Normalize MACs for reliable matching
        const latestMetric = (metrics as any[] || []).find(m =>
          m.mac_address?.toLowerCase() === pc.mac_address?.toLowerCase()
        );
        const ram_usage_pct = latestMetric?.ram_usage_pct || 0;
        return {
          ...pc,
          cpu_usage: latestMetric?.cpu_usage || 0,
          ram_usage_pct: ram_usage_pct,
          ram_used: pc.ram_total ? Number(((ram_usage_pct / 100) * pc.ram_total).toFixed(2)) : 0,
          storage_used: 0 // Not tracked in current SQL, fallback to 0
        } as DeviceWithMetrics;
      });

      setDevices(devicesWithStats);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch devices'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time and Polling setup
  useEffect(() => {
    fetchData();

    // Refresh status and poll metrics every 10s
    const timer = setInterval(() => {
      setNow(new Date());
      fetchData();
    }, 10000);

    const pcChannel = supabase
      .channel('lab_pcs_changes_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lab_pcs' }, (payload) => {
        const updatedPc = payload.new as Tables<'lab_pcs'>;
        const eventType = payload.eventType;

        setDevices(prev => {
          if (eventType === 'INSERT') {
            return [...prev, { ...updatedPc, is_online_local: true }];
          }
          if (eventType === 'UPDATE') {
            return prev.map(d => d.id === updatedPc.id ? { ...d, ...updatedPc } : d);
          }
          if (eventType === 'DELETE') {
            return prev.filter(d => d.id !== (payload.old as any).id);
          }
          return prev;
        });
      })
      .subscribe();

    const metricsChannel = supabase
      .channel('pc_metrics_changes_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pc_metrics' }, (payload) => {
        const newMetric = payload.new as any;
        const metricMac = newMetric.mac_address?.toLowerCase();

        setDevices(prev => prev.map(d => {
          if (d.mac_address?.toLowerCase() === metricMac) {
            const ram_usage_pct = newMetric.ram_usage_pct || 0;
            return {
              ...d,
              cpu_usage: newMetric.cpu_usage || 0,
              ram_usage_pct: ram_usage_pct,
              ram_used: d.ram_total ? Number(((ram_usage_pct / 100) * d.ram_total).toFixed(2)) : 0,
              // Update last_seen immediately when a metric arrives
              last_seen: new Date().toISOString()
            };
          }
          return d;
        }));
      })
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(pcChannel);
      supabase.removeChannel(metricsChannel);
    };
  }, [fetchData]);

  // Calculate local online status: device is online if last_seen is within 30 seconds
  const devicesWithLocalStatus = devices.map(d => {
    const lastSeenDate = d.last_seen ? new Date(d.last_seen) : null;
    const isOnline = lastSeenDate && (now.getTime() - lastSeenDate.getTime()) < 30000;
    return { ...d, is_online_local: !!isOnline };
  });

  const onlineCount = devicesWithLocalStatus.filter(d => d.is_online_local).length;
  const offlineCount = devicesWithLocalStatus.filter(d => !d.is_online_local).length;

  return { devices: devicesWithLocalStatus, loading, error, onlineCount, offlineCount, totalCount: devices.length };
}
