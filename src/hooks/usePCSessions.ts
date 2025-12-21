import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export function usePCSessions(deviceId: string) {
  return useQuery({
    queryKey: ["sessions", deviceId],
    queryFn: async () => {
      const data = await apiFetch(`/devices/${deviceId}`);
      return data.sessions;
    },
  });
}
