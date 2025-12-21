import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useAlerts() {
    return useQuery({
        queryKey: ["alerts"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("alerts")
                .select("*, devices(hostname)")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
        refetchInterval: 5000,
    });
}
