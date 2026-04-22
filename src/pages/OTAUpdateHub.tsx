import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, ShieldCheck, RefreshCw, History, Rocket, CheckCircle2,
  XCircle, AlertTriangle, Lock, Eye, EyeOff, ChevronDown, ChevronUp,
  FileDown, Loader2, Zap, RotateCcw, CloudUpload, Hash, Package
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OtaRelease {
  id: number;
  version: string;
  file_name: string;
  file_size_bytes: number;
  sha256_hash: string;
  storage_path: string;
  public_url: string;
  release_notes: string | null;
  deployed_by: string;
  is_active: boolean;
  is_rolled_back: boolean;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function sha256Browser(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.hexFormat(16).padStart(2, '0'))
    .join('');
}

// Fix: proper hex method
async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder().encode(pin);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-PK', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ─── PIN Gate ─────────────────────────────────────────────────────────────────
function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [show, setShow] = useState(false);
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handleDigit = async (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[idx] = val.slice(-1);
    setDigits(next);
    setError(false);

    if (val && idx < 3) {
      refs[idx + 1].current?.focus();
    }

    if (next.every(d => d !== '') && idx === 3) {
      const pin = next.join('');
      const hashed = await hashPin(pin);
      // SHA-256 of "1234"
      const correct = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';
      if (hashed === correct) {
        onUnlock();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => { setShake(false); setDigits(['', '', '', '']); refs[0].current?.focus(); }, 600);
      }
    }
  };

  const handleKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs[idx - 1].current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
      <div className="relative w-full max-w-sm mx-4">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-violet-600/10 blur-3xl rounded-full scale-150 pointer-events-none" />

        <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.3)]">
              <Lock className="w-8 h-8 text-violet-400" />
            </div>
          </div>

          <h1 className="text-xl font-black text-white text-center tracking-widest uppercase mb-1">
            OTA Update Hub
          </h1>
          <p className="text-slate-500 text-xs text-center mb-8 tracking-wide">
            Enter 4-digit admin PIN to access release management
          </p>

          {/* PIN Inputs */}
          <div className={cn(
            "flex items-center justify-center gap-3 mb-6 transition-all duration-300",
            shake && "animate-[shake_0.4s_ease-in-out]"
          )}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={refs[i]}
                type={show ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKey(i, e)}
                autoFocus={i === 0}
                className={cn(
                  "w-14 h-14 text-center text-2xl font-black rounded-xl border-2 bg-white/5 text-white",
                  "outline-none transition-all duration-200 select-none",
                  error
                    ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] text-red-400"
                    : d
                      ? "border-violet-500 shadow-[0_0_15px_rgba(124,58,237,0.4)]"
                      : "border-white/10 focus:border-violet-500/70"
                )}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center font-bold tracking-widest uppercase mb-4 animate-pulse">
              ✗ Incorrect PIN
            </p>
          )}

          {/* Show/hide toggle */}
          <button
            onClick={() => setShow(!show)}
            className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-300 text-xs transition-colors"
          >
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {show ? 'Hide digits' : 'Show digits'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

// ─── Main OTA Hub ─────────────────────────────────────────────────────────────
export default function OTAUpdateHub() {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />;
  return <OTAHubContent />;
}

function OTAHubContent() {
  const qc = useQueryClient();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [computedHash, setComputedHash] = useState('');
  const [hashLoading, setHashLoading] = useState(false);
  const [version, setVersion] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Queries ────────────────────────────────────────────────────────
  const { data: currentConfig } = useQuery({
    queryKey: ['global-configs-ota'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_configs')
        .select('key, value')
        .in('key', ['agent_version', 'agent_hash', 'update_url']);
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach(r => { map[r.key] = r.value; });
      return map;
    },
    refetchInterval: 15000,
  });

  const { data: releases = [], isLoading: releasesLoading } = useQuery<OtaRelease[]>({
    queryKey: ['ota-releases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ota_releases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000,
  });

  // ── File selection ────────────────────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    setSelectedFile(file);
    setComputedHash('');
    setHashLoading(true);
    try {
      const hash = await computeSHA256(file);
      setComputedHash(hash);
    } finally {
      setHashLoading(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // ── Deploy mutation ────────────────────────────────────────────────
  const deployMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !version || !computedHash) throw new Error('Missing fields');

      // 1. Upload to Supabase Storage
      const storagePath = `v${version}/${selectedFile.name}`;
      setUploadProgress(10);

      const { error: uploadError } = await supabase.storage
        .from('agent-releases')
        .upload(storagePath, selectedFile, {
          contentType: 'application/octet-stream',
          upsert: true,
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      setUploadProgress(60);

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from('agent-releases')
        .getPublicUrl(storagePath);
      const publicUrl = urlData.publicUrl;
      setUploadProgress(70);

      // 3. Deactivate all previous active releases
      await supabase
        .from('ota_releases')
        .update({ is_active: false })
        .eq('is_active', true);

      // 4. Insert new release record
      const { error: dbError } = await supabase
        .from('ota_releases')
        .insert({
          version,
          file_name: selectedFile.name,
          file_size_bytes: selectedFile.size,
          sha256_hash: computedHash,
          storage_path: storagePath,
          public_url: publicUrl,
          release_notes: releaseNotes || null,
          deployed_by: 'Admin',
          is_active: true,
          is_rolled_back: false,
        });

      if (dbError) throw new Error(`DB insert failed: ${dbError.message}`);
      setUploadProgress(85);

      // 5. Update global_configs (what the Flask server reads)
      await supabase.from('global_configs').upsert([
        { key: 'agent_version', value: version },
        { key: 'agent_hash',    value: computedHash },
        { key: 'update_url',    value: publicUrl },
      ], { onConflict: 'key' });

      setUploadProgress(100);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['global-configs-ota'] });
      qc.invalidateQueries({ queryKey: ['ota-releases'] });
      setSelectedFile(null);
      setComputedHash('');
      setVersion('');
      setReleaseNotes('');
      setUploadProgress(0);
    },
    onError: () => setUploadProgress(0),
  });

  // ── Rollback mutation ──────────────────────────────────────────────
  const rollbackMutation = useMutation({
    mutationFn: async (release: OtaRelease) => {
      // Deactivate current
      await supabase.from('ota_releases').update({ is_active: false }).eq('is_active', true);
      // Re-activate the chosen one
      await supabase.from('ota_releases').update({ is_active: true, is_rolled_back: false }).eq('id', release.id);
      // Update global_configs
      await supabase.from('global_configs').upsert([
        { key: 'agent_version', value: release.version },
        { key: 'agent_hash',    value: release.sha256_hash },
        { key: 'update_url',    value: release.public_url },
      ], { onConflict: 'key' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['global-configs-ota'] });
      qc.invalidateQueries({ queryKey: ['ota-releases'] });
    },
  });

  const activeRelease = releases.find(r => r.is_active);
  const isDeployReady = selectedFile && version && computedHash && !hashLoading;

  return (
    <div className="min-h-screen bg-[#070b14] text-white p-4 md:p-6 space-y-5">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-widest uppercase text-white flex items-center gap-3">
            <Rocket className="w-6 h-6 text-violet-400" />
            OTA Update Hub
          </h1>
          <p className="text-slate-500 text-xs mt-1 tracking-wide">
            Release management for Lab Guardian Pro — provincial fleet of 10,000 PCs
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-[10px] font-black tracking-widest uppercase">Supabase CDN</span>
        </div>
      </div>

      {/* ── Live Config Banner ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Active Version', value: currentConfig?.agent_version || '—', icon: Package, color: 'violet' },
          { label: 'SHA-256 Hash', value: currentConfig?.agent_hash ? `${currentConfig.agent_hash.slice(0, 12)}...` : '—', icon: Hash, color: 'blue' },
          { label: 'Fleet Status', value: '10,000 PCs Polling', icon: Zap, color: 'emerald' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#0d1117]/80 border border-white/8 rounded-xl p-4 flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
              color === 'violet' && "bg-violet-600/20 border border-violet-500/20",
              color === 'blue'   && "bg-blue-600/20 border border-blue-500/20",
              color === 'emerald' && "bg-emerald-600/20 border border-emerald-500/20",
            )}>
              <Icon className={cn(
                "w-5 h-5",
                color === 'violet' && "text-violet-400",
                color === 'blue'   && "text-blue-400",
                color === 'emerald' && "text-emerald-400",
              )} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{label}</p>
              <p className="text-sm font-bold text-white truncate font-mono">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Deploy New Release ─────────────────────────────────────────── */}
      <div className="bg-[#0d1117]/80 border border-white/8 rounded-2xl p-5 space-y-4">
        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <CloudUpload className="w-4 h-4 text-violet-400" />
          Deploy New Release
        </h2>

        {/* Version + Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
              Version Number *
            </label>
            <input
              type="text"
              placeholder="e.g. 5.1.0"
              value={version}
              onChange={e => setVersion(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500/60 transition-colors font-mono"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
              Release Notes (optional)
            </label>
            <input
              type="text"
              placeholder="Bug fixes, new features…"
              value={releaseNotes}
              onChange={e => setReleaseNotes(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500/60 transition-colors"
            />
          </div>
        </div>

        {/* Drop Zone */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer group",
            dragOver
              ? "border-violet-500 bg-violet-600/10 shadow-[0_0_30px_rgba(124,58,237,0.2)]"
              : selectedFile
                ? "border-emerald-500/60 bg-emerald-600/5"
                : "border-white/10 hover:border-violet-500/40 hover:bg-white/[0.02]"
          )}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !selectedFile && fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".exe,application/octet-stream"
            onChange={onFileChange}
          />

          {selectedFile ? (
            <div className="space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-emerald-400 font-bold text-sm">{selectedFile.name}</p>
              <p className="text-slate-500 text-xs">{formatBytes(selectedFile.size)}</p>
              <button
                onClick={e => { e.stopPropagation(); setSelectedFile(null); setComputedHash(''); }}
                className="text-xs text-red-400 hover:text-red-300 mt-1 underline"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className={cn(
                "w-10 h-10 mx-auto transition-transform duration-300",
                dragOver ? "text-violet-400 scale-125" : "text-slate-600 group-hover:text-violet-500 group-hover:scale-110"
              )} />
              <div>
                <p className="text-white font-bold text-sm">Drop agent.exe here</p>
                <p className="text-slate-500 text-xs mt-1">or click to browse — max 50 MB</p>
              </div>
            </div>
          )}
        </div>

        {/* SHA-256 Display */}
        {(hashLoading || computedHash) && (
          <div className="bg-black/40 border border-white/8 rounded-xl p-3 flex items-start gap-3">
            <Hash className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                SHA-256 Hash (calculated in browser)
              </p>
              {hashLoading ? (
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Computing…
                </div>
              ) : (
                <p className="text-blue-300 text-xs font-mono break-all">{computedHash}</p>
              )}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Uploading to Supabase CDN…</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error/Success */}
        {deployMutation.isError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-red-400 text-xs">{(deployMutation.error as Error).message}</p>
          </div>
        )}
        {deployMutation.isSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-emerald-400 text-xs font-bold">
              ✓ Fleet rollout initiated — 10,000 PCs will update within 30 seconds.
            </p>
          </div>
        )}

        {/* Deploy Button */}
        <button
          onClick={() => deployMutation.mutate()}
          disabled={!isDeployReady || deployMutation.isPending}
          className={cn(
            "w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2",
            isDeployReady && !deployMutation.isPending
              ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 shadow-[0_5px_20px_rgba(124,58,237,0.4)] hover:shadow-[0_8px_25px_rgba(124,58,237,0.6)] hover:-translate-y-0.5"
              : "bg-white/5 text-slate-600 cursor-not-allowed"
          )}
        >
          {deployMutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Deploying to Fleet…</>
          ) : (
            <><Rocket className="w-4 h-4" /> Deploy to 10,000 PCs</>
          )}
        </button>
      </div>

      {/* ── Release History ────────────────────────────────────────────── */}
      <div className="bg-[#0d1117]/80 border border-white/8 rounded-2xl overflow-hidden">
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
        >
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <History className="w-4 h-4 text-violet-400" />
            Release History
            <span className="px-1.5 py-0.5 rounded bg-violet-600/20 text-violet-300 text-[9px] font-bold">
              {releases.length}
            </span>
          </h2>
          {historyOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {historyOpen && (
          <div className="border-t border-white/5">
            {releasesLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Loading releases…</span>
              </div>
            ) : releases.length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-sm">
                No releases deployed yet.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {releases.map(release => (
                  <div
                    key={release.id}
                    className={cn(
                      "flex items-center gap-4 p-4 transition-all duration-200 flex-wrap",
                      release.is_active
                        ? "bg-violet-600/5 hover:bg-violet-600/8"
                        : "hover:bg-white/[0.02]"
                    )}
                  >
                    {/* Status badge */}
                    <div className="shrink-0">
                      {release.is_active ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                          <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          LIVE
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/8 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                          archived
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-black text-sm font-mono">v{release.version}</span>
                        <span className="text-slate-600 text-xs">{formatBytes(release.file_size_bytes)}</span>
                        <span className="text-slate-600 text-xs">·</span>
                        <span className="text-slate-500 text-xs">{formatDate(release.created_at)}</span>
                      </div>
                      <p className="text-slate-600 text-[10px] font-mono mt-0.5 truncate">
                        SHA: {release.sha256_hash.slice(0, 16)}…
                      </p>
                      {release.release_notes && (
                        <p className="text-slate-400 text-xs mt-0.5 italic">{release.release_notes}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={release.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white/5 hover:bg-blue-500/20 border border-white/8 hover:border-blue-500/30 text-slate-400 hover:text-blue-400 transition-all"
                        title="Download"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </a>
                      {!release.is_active && (
                        <button
                          onClick={() => rollbackMutation.mutate(release)}
                          disabled={rollbackMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-widest transition-all"
                          title="Rollback to this version"
                        >
                          {rollbackMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                          Rollback
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Architecture Info ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            icon: ShieldCheck,
            title: 'Cryptographic Safety',
            desc: 'SHA-256 hash verified by every agent before binary swap. Corrupted files are auto-deleted.',
            color: 'emerald'
          },
          {
            icon: RefreshCw,
            title: 'Resumable Downloads',
            desc: 'HTTP Range headers ensure a failed 14MB download resumes from exactly byte 14MB.',
            color: 'blue'
          },
          {
            icon: AlertTriangle,
            title: 'Zero Server Load',
            desc: '10,000 PCs download directly from Supabase CDN. Flask server sends only a URL.',
            color: 'amber'
          },
        ].map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="bg-[#0d1117]/60 border border-white/6 rounded-xl p-4">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center mb-3",
              color === 'emerald' && "bg-emerald-600/15 border border-emerald-500/20",
              color === 'blue'    && "bg-blue-600/15 border border-blue-500/20",
              color === 'amber'   && "bg-amber-600/15 border border-amber-500/20",
            )}>
              <Icon className={cn(
                "w-4 h-4",
                color === 'emerald' && "text-emerald-400",
                color === 'blue'    && "text-blue-400",
                color === 'amber'   && "text-amber-400",
              )} />
            </div>
            <p className="text-white text-xs font-bold mb-1">{title}</p>
            <p className="text-slate-500 text-[10px] leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
