import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ScanResult } from '@/utils/scanner';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export type Progress = {
  achievements: string[];
  scannedHosts: string[];
  viewedPorts: number[];
  quizCompleted: boolean;
  quizPerfect: boolean;
  reportGenerated: boolean;
  lastScan: ScanResult | null;
  scanCount: number;
};

const DEFAULTS: Progress = {
  achievements: [], scannedHosts: [], viewedPorts: [],
  quizCompleted: false, quizPerfect: false, reportGenerated: false, lastScan: null, scanCount: 0,
};

const STORAGE_KEY = 'psd.progress.v2';

type ProgressContextValue = {
  progress: Progress; toastId: string | null;
  unlockAchievement: (id: string) => void;
  recordScan: (result: ScanResult) => void;
  recordViewedPort: (port: number) => void;
  recordQuiz: (perfect: boolean) => void;
  recordReport: () => void;
  dismissToast: () => void;
  reset: () => void;
};

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Progress>(DEFAULTS);
  const [toastId, setToastId] = useState<string | null>(null);

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setProgress({ ...DEFAULTS, ...JSON.parse(raw) }); } catch { /* ignore */ }
  }, []);

  const persist = useCallback((updater: (prev: Progress) => Progress) => {
    setProgress((prev) => { const next = updater(prev); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ } return next; });
  }, []);

  const unlockAchievement = useCallback((id: string) => {
    setProgress((prev) => {
      if (prev.achievements.includes(id)) return prev;
      const next = { ...prev, achievements: [...prev.achievements, id] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      setToastId(id);
      return next;
    });
  }, []);

  const recordScan = useCallback((result: ScanResult) => {
    persist((prev) => {
      const hosts = prev.scannedHosts.includes(result.host) ? prev.scannedHosts : [...prev.scannedHosts, result.host];
      return { ...prev, scannedHosts: hosts, lastScan: result, scanCount: prev.scanCount + 1 };
    });
    if (user) {
      supabase.from('scan_history').insert({
        host: result.host, total_ports: result.ports.length, open_count: result.openCount,
        closed_count: result.closedCount, duration_ms: result.durationMs, results: result.ports,
      }).then(({ error }) => { if (error) console.warn('Failed to save scan history:', error.message); });
    }
  }, [persist, user]);

  const recordViewedPort = useCallback((port: number) => {
    persist((prev) => prev.viewedPorts.includes(port) ? prev : { ...prev, viewedPorts: [...prev.viewedPorts, port] });
  }, [persist]);

  const recordQuiz = useCallback((perfect: boolean) => {
    persist((prev) => ({ ...prev, quizCompleted: true, quizPerfect: perfect || prev.quizPerfect }));
  }, [persist]);

  const recordReport = useCallback(() => { persist((prev) => ({ ...prev, reportGenerated: true })); }, [persist]);

  const reset = useCallback(() => {
    setProgress(DEFAULTS);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULTS)); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (progress.scanCount >= 1) unlockAchievement('first-scan');
    if (progress.scannedHosts.length >= 5) unlockAchievement('network-explorer');
    if (progress.viewedPorts.length >= 10) unlockAchievement('port-master');
    if (progress.reportGenerated) unlockAchievement('security-analyst');
  }, [progress.scanCount, progress.scannedHosts.length, progress.viewedPorts.length, progress.reportGenerated, unlockAchievement]);

  const dismissToast = useCallback(() => setToastId(null), []);

  const value = useMemo<ProgressContextValue>(() => ({
    progress, toastId, unlockAchievement, recordScan, recordViewedPort, recordQuiz, recordReport, dismissToast, reset,
  }), [progress, toastId, unlockAchievement, recordScan, recordViewedPort, recordQuiz, recordReport, dismissToast, reset]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
