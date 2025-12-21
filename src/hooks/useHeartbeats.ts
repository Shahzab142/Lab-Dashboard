import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export function useHeartbeats(deviceId: string) {
    return useQuery({
        queryKey: ["heartbeats", deviceId],
        queryFn: async () => {
            const data = await apiFetch(`/devices/${deviceId}`);
            return data.heartbeats;
        },
    });
}
