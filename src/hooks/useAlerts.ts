import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export function useAlerts() {
    return useQuery({
        queryKey: ["alerts"],
        queryFn: () => apiFetch("/alerts"),
        refetchInterval: 5000,
    });
}
