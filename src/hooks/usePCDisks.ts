import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export function usePCDisks(deviceId: string) {
  return useQuery({
    queryKey: ["disks", deviceId],
    queryFn: async () => {
      const data = await apiFetch(`/devices/${deviceId}`);
      return data.disks;
    },
  });
}
