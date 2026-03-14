export interface Device {
  system_id: string;
  hardware_id: string | null;
  pc_name: string;
  city: string | null;
  tehsil: string | null;
  lab_name: string | null;
  cpu_score: number | null;
  runtime_minutes: number | null;
  status: string | null;
  last_seen: string | null;
  is_defective: boolean;
  health_score: number;
  ram_total: string | null;
  disk_total: string | null;
  disk_free: string | null;
  os_info: string | null;
  cpu_model: string | null;
  gpu_model: string | null;
  local_ip: string | null;
  app_usage: Record<string, number> | null;
  today_start_time: string | null;
  today_last_active: string | null;
  created_at: string | null;
  hwid?: string | null; // Legacy/Alias support
  _is_online?: boolean; // UI helper
}

export interface DeviceDailyHistory {
  id: number;
  device_id: string;
  history_date: string;
  avg_score: number;
  runtime_minutes: number;
  start_time: string | null;
  end_time: string | null;
  city: string | null;
  lab_name: string | null;
  tehsil: string | null;
  app_usage: Record<string, number> | null;
  health_score: number;
  is_defective: boolean;
  created_at: string;
}

export interface DeviceSession {
  id: number;
  device_id: string;
  city: string | null;
  lab_name: string | null;
  tehsil: string | null;
  avg_score: number | null;
  start_time: string;
  end_time: string | null;
  created_at: string;
}
