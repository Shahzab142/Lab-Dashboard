import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useLabPCs() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devices")
        .select(`
          *,
          sessions(*)
        `)
        .order("last_seen", { ascending: false });

      if (error) throw error;

      // Attach current_session for components that expect it
      return data.map((device: any) => ({
        ...device,
        current_session: device.sessions?.find((s: any) => !s.end_time)
      }));
    },
    refetchInterval: 5000,
  });
}
