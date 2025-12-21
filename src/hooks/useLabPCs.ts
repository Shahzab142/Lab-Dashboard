import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export function useLabPCs(status?: string) {
  return useQuery({
    queryKey: ["devices", status],
    queryFn: () =>
      apiFetch(
        status ? `/devices?status=${status}` : "/devices"
      ),
    refetchInterval: 5000,
  });
}
