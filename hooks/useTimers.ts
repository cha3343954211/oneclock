import { useState, useCallback } from 'react';
import { TimerMode, TimerStatus } from '../types';

// ---- 类型 ----

export interface TimerRecord {
  id: string;
  name: string;
  mode: TimerMode;
  status: TimerStatus;
  accumulated: number;  // 上次暂停时已累计的 ms
  startTs: number;      // 最近一次 start 时的 Date.now()，未运行时为 0
  countdownTarget: number; // 倒计时目标 ms
  // 视觉配置（与 ElementConfig 字段一一对应）
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
  opacity: number;
  customColor: string | null;
}

export type VisualPatch = Partial<
  Pick<TimerRecord, 'x' | 'y' | 'scale' | 'rotation' | 'zIndex' | 'opacity' | 'customColor'>
>;

export interface UseTimersReturn {
  timers: TimerRecord[];
  addTimer: () => void;
  removeTimer: (id: string) => void;
  updateVisual: (id: string, patch: VisualPatch) => void;
  setMode: (id: string, mode: TimerMode) => void;
  setCountdownTarget: (id: string, ms: number) => void;
  start: (id: string) => void;
  pause: (id: string) => void;
  reset: (id: string) => void;
  finish: (id: string) => void;
}

// ---- 常量 ----

const DEFAULT_COUNTDOWN = 5 * 60 * 1000;
const MAX_TIMERS = 6;
const TIMER_COLORS = ['#60a5fa', '#34d399', '#f472b6', '#fb923c', '#a78bfa', '#facc15'];
const STORAGE_KEY = 'zenclock_timers_v2';

// ---- 工厂 ----

function genId(): string {
  return `tmr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function makeTimer(index: number): TimerRecord {
  return {
    id: genId(),
    name: `计时器 ${index + 1}`,
    mode: 'stopwatch',
    status: 'idle',
    accumulated: 0,
    startTs: 0,
    countdownTarget: DEFAULT_COUNTDOWN,
    x: index * 6,
    y: 10 + index * 6,
    scale: 1,
    rotation: 0,
    zIndex: 25 + index,
    opacity: 1,
    customColor: TIMER_COLORS[index % TIMER_COLORS.length],
  };
}

// ---- 持久化 ----

function loadTimers(): TimerRecord[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return [];
    const parsed: TimerRecord[] = JSON.parse(s);
    // 加载时：将运行中的转为暂停（不能跨页面继续）
    return parsed.map(t =>
      t.status === 'running'
        ? { ...t, status: 'paused' as TimerStatus, accumulated: t.accumulated + Math.max(0, Date.now() - t.startTs) }
        : t
    );
  } catch {
    return [];
  }
}

function save(timers: TimerRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
  } catch { /* 配额超限时静默 */ }
}

// ---- Hook ----

export function useTimers(): UseTimersReturn {
  const [timers, setTimers] = useState<TimerRecord[]>(loadTimers);

  /** 通用更新辅助：修改指定 id 的记录并持久化 */
  const patch = useCallback((id: string, p: Partial<TimerRecord>) => {
    setTimers(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...p } : t);
      save(next);
      return next;
    });
  }, []);

  const addTimer = useCallback(() => {
    setTimers(prev => {
      if (prev.length >= MAX_TIMERS) return prev;
      const t = makeTimer(prev.length);
      const next = [...prev, t];
      save(next);
      return next;
    });
  }, []);

  const removeTimer = useCallback((id: string) => {
    setTimers(prev => {
      const next = prev.filter(t => t.id !== id);
      save(next);
      return next;
    });
  }, []);

  const updateVisual = useCallback((id: string, p: VisualPatch) => {
    patch(id, p);
  }, [patch]);

  const setMode = useCallback((id: string, mode: TimerMode) => {
    patch(id, { mode, status: 'idle', accumulated: 0, startTs: 0 });
  }, [patch]);

  const setCountdownTarget = useCallback((id: string, ms: number) => {
    patch(id, { countdownTarget: ms });
  }, [patch]);

  const start = useCallback((id: string) => {
    patch(id, { status: 'running', startTs: Date.now() });
  }, [patch]);

  const pause = useCallback((id: string) => {
    setTimers(prev => {
      const t = prev.find(x => x.id === id);
      if (!t || t.status !== 'running') return prev;
      const acc = t.accumulated + Math.max(0, Date.now() - t.startTs);
      const next = prev.map(x => x.id === id ? { ...x, status: 'paused' as TimerStatus, accumulated: acc } : x);
      save(next);
      return next;
    });
  }, []);

  const reset = useCallback((id: string) => {
    patch(id, { status: 'idle', accumulated: 0, startTs: 0 });
  }, [patch]);

  const finish = useCallback((id: string) => {
    patch(id, { status: 'finished' });
  }, [patch]);

  return { timers, addTimer, removeTimer, updateVisual, setMode, setCountdownTarget, start, pause, reset, finish };
}

// ---- 展示值计算（纯函数，在 TimerDisplay 的 render 阶段调用）----

export function calcDisplayMs(t: TimerRecord): number {
  switch (t.status) {
    case 'running': {
      const elapsed = t.accumulated + Math.max(0, Date.now() - t.startTs);
      return t.mode === 'countdown' ? Math.max(0, t.countdownTarget - elapsed) : elapsed;
    }
    case 'paused':
      return t.mode === 'countdown'
        ? Math.max(0, t.countdownTarget - t.accumulated)
        : t.accumulated;
    case 'idle':
      return t.mode === 'countdown' ? t.countdownTarget : 0;
    case 'finished':
      return 0;
  }
}

// ---- 提示音（无音频文件依赖）----

export function playAlertTone(): void {
  try {
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.connect(ctx.destination);
    master.gain.setValueAtTime(0.22, ctx.currentTime);

    const beep = (freq: number, t: number, dur: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(master);
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, ctx.currentTime + t);
      g.gain.setValueAtTime(0, ctx.currentTime + t);
      g.gain.linearRampToValueAtTime(1, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + dur + 0.05);
    };

    beep(880,  0,    0.14);
    beep(1100, 0.18, 0.14);
    beep(880,  0.36, 0.14);
    beep(1320, 0.54, 0.30);
  } catch { /* 浏览器限制时静默 */ }
}

// ---- 时间格式化 ----

export function formatMs(ms: number, showCs = false): string {
  const n = Math.max(0, ms);
  const h  = Math.floor(n / 3_600_000);
  const m  = Math.floor((n % 3_600_000) / 60_000);
  const s  = Math.floor((n % 60_000) / 1_000);
  const cs = Math.floor((n % 1_000) / 10);
  const p  = (v: number) => String(v).padStart(2, '0');

  if (showCs) return h > 0 ? `${p(h)}:${p(m)}:${p(s)}.${p(cs)}` : `${p(m)}:${p(s)}.${p(cs)}`;
  return h > 0 ? `${p(h)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}
