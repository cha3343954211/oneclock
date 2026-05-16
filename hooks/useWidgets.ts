import { useState, useCallback } from 'react';
import { WidgetType, WidgetRecord, TimerMode, TimerStatus } from '../types';

// ---- 常量 ----

const STORAGE_KEY  = 'for_clock_widgets_v1';
const DRAG_KEY     = 'for_clock_drag_sensitivity';
const MAX_WIDGETS  = 12;
const DEFAULT_CD   = 5 * 60 * 1000;
const TIMER_COLORS = ['#60a5fa', '#34d399', '#f472b6', '#fb923c', '#a78bfa', '#facc15'];

export const WIDGET_LABELS: Record<WidgetType, string> = {
  digital:  '数字时钟',
  analog:   '圆形时钟',
  calendar: '日历',
  timer:    '计时器',
};

const DEFAULT_SCALES: Record<WidgetType, number> = {
  digital: 1, analog: 0.8, calendar: 1, timer: 1,
};

// ---- ID 生成 ----

function genId(): string {
  return `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

// ---- Widget 工厂 ----

function makeWidget(type: WidgetType, existingCount: number): WidgetRecord {
  const i   = existingCount;
  const col = TIMER_COLORS[i % TIMER_COLORS.length];
  // 新增组件错开摆放，避免完全重叠
  const offsetX = ((i % 4) - 1.5) * 12;
  const offsetY = (Math.floor(i / 4) - 0.5) * 18;
  return {
    id:              genId(),
    type,
    name:            WIDGET_LABELS[type],
    x:               offsetX,
    y:               offsetY,
    scale:           DEFAULT_SCALES[type],
    rotation:        0,
    zIndex:          10 + i,
    visible:         true,
    opacity:         1,
    customColor:     type === 'timer' ? col : null,
    mode:            'stopwatch',
    status:          'idle',
    accumulated:     0,
    startTs:         0,
    countdownTarget: DEFAULT_CD,
  };
}

// ---- 美观默认排版（按类型，坐标单位 vw/vh，原点=屏幕中心）----
// x: calc(50% + x vw),  y: calc(50% + y vh)

type LayoutSlot = { x: number; y: number; scale: number };
type LayoutMap  = Record<WidgetType, LayoutSlot[]>;

// 横屏 / 桌面：左右分区
const LANDSCAPE_LAYOUT: LayoutMap = {
  digital:  [
    { x:  18,  y:  0,   scale: 1.0  },  // 右中（主角）
    { x: -22,  y: -20,  scale: 0.72 },  // 左上
    { x:   0,  y: -15,  scale: 0.85 },  // 中上
  ],
  analog:   [
    { x: -22,  y:  0,   scale: 0.85 },  // 左中
    { x:  20,  y:  18,  scale: 0.9  },  // 右下
    { x:   0,  y:  30,  scale: 0.75 },  // 底部中
  ],
  calendar: [
    { x:  18,  y:  16,  scale: 0.88 },  // 数字钟下方
    { x:  24,  y:   5,  scale: 0.9  },  // 右侧
    { x: -24,  y:   5,  scale: 0.9  },  // 左侧
  ],
  timer:    [
    { x:  28,  y: -12,  scale: 0.9  },  // 右上
    { x:  28,  y:   2,  scale: 0.82 },  // 右中
    { x:  28,  y:  15,  scale: 0.75 },  // 右下
    { x: -28,  y: -12,  scale: 0.9  },  // 左上
  ],
};

// 竖屏 / 手机：上下分层（窄屏避免横向重叠）
const PORTRAIT_LAYOUT: LayoutMap = {
  digital:  [
    { x:  0,  y: -22,  scale: 0.82 },  // 上方主角（含日期）
    { x:  0,  y:  -5,  scale: 0.58 },  // 中上 mini
    { x:  0,  y:  32,  scale: 0.58 },  // 下方 mini
  ],
  analog:   [
    { x:  0,  y:  18,  scale: 0.95 },  // 下方主角
    { x: -22, y: -28,  scale: 0.55 },  // 左上小
    { x:  22, y: -28,  scale: 0.55 },  // 右上小
  ],
  calendar: [
    { x:  0,  y:  -5,  scale: 0.85 },  // 数字钟与表盘之间
    { x:  0,  y:  36,  scale: 0.78 },  // 底部
    { x:  0,  y: -36,  scale: 0.78 },  // 顶部
  ],
  timer:    [
    { x: -22, y: -30,  scale: 0.7  },  // 左上
    { x:  22, y: -30,  scale: 0.7  },  // 右上
    { x: -22, y:  36,  scale: 0.7  },  // 左下
    { x:  22, y:  36,  scale: 0.7  },  // 右下
  ],
};

/** 判断当前是否为竖屏（仅在浏览器环境调用）*/
function isPortrait(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerHeight > window.innerWidth;
}

/** 按当前屏幕方向取布局 */
export function getCurrentLayout(): LayoutMap {
  return isPortrait() ? PORTRAIT_LAYOUT : LANDSCAPE_LAYOUT;
}

// 兼容旧代码：导出仍以横屏布局为名
export const DEFAULT_LAYOUT: LayoutMap = LANDSCAPE_LAYOUT;

// ---- 默认初始组件 ----

function getDefaults(): WidgetRecord[] {
  const L = getCurrentLayout();
  return [
    { ...makeWidget('analog',   0), id: 'w_analog_0',   ...L.analog[0],   zIndex: 5 },
    { ...makeWidget('digital',  1), id: 'w_digital_0',  ...L.digital[0],  zIndex: 10, showDate: true },
  ];
}

// ---- 持久化 ----

function load(): WidgetRecord[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const parsed: WidgetRecord[] = JSON.parse(s);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // 页面重载时将运行中的计时器转为暂停，并保存累计时间
        return parsed.map(w =>
          w.status === 'running'
            ? { ...w, status: 'paused' as TimerStatus, accumulated: w.accumulated + Math.max(0, Date.now() - w.startTs) }
            : w
        );
      }
    }
    return getDefaults();
  } catch {
    return getDefaults();
  }
}

function save(widgets: WidgetRecord[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets)); } catch { /* 配额超限时静默 */ }
}

// ---- 工具函数（供 TimerDisplay 使用）----

export function calcDisplayMs(w: WidgetRecord): number {
  switch (w.status) {
    case 'running': {
      const elapsed = w.accumulated + Math.max(0, Date.now() - w.startTs);
      return w.mode === 'countdown' ? Math.max(0, w.countdownTarget - elapsed) : elapsed;
    }
    case 'paused':
      return w.mode === 'countdown'
        ? Math.max(0, w.countdownTarget - w.accumulated)
        : w.accumulated;
    case 'idle':
      return w.mode === 'countdown' ? w.countdownTarget : 0;
    case 'finished':
      return 0;
  }
}

export function formatMs(ms: number, showCs = false): string {
  const n  = Math.max(0, ms);
  const h  = Math.floor(n / 3_600_000);
  const m  = Math.floor((n % 3_600_000) / 60_000);
  const s  = Math.floor((n % 60_000) / 1_000);
  const cs = Math.floor((n % 1_000) / 10);
  const p  = (v: number) => String(v).padStart(2, '0');
  if (showCs) return h > 0 ? `${p(h)}:${p(m)}:${p(s)}.${p(cs)}` : `${p(m)}:${p(s)}.${p(cs)}`;
  return h > 0 ? `${p(h)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

export function playAlertTone(): void {
  try {
    const ctx    = new AudioContext();
    const master = ctx.createGain();
    master.connect(ctx.destination);
    master.gain.setValueAtTime(0.22, ctx.currentTime);
    const beep = (freq: number, t: number, dur: number) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(master);
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, ctx.currentTime + t);
      g.gain.setValueAtTime(0,     ctx.currentTime + t);
      g.gain.linearRampToValueAtTime(1,     ctx.currentTime + t + 0.02);
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

// ---- Hook 返回类型 ----

export interface UseWidgetsReturn {
  widgets: WidgetRecord[];
  dragSensitivity: number;
  activeSettingsId: string | null;
  setActiveSettingsId: (id: string | null) => void;
  addWidget: (type: WidgetType) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, patch: Partial<WidgetRecord>) => void;
  resetPositions: () => void;
  setDragSensitivity: (v: number) => void;
  // 计时器操作（仅对 type==='timer' 的 widget 有效）
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  finishTimer: (id: string) => void;
  setTimerMode: (id: string, mode: TimerMode) => void;
  setTimerCountdownTarget: (id: string, ms: number) => void;
}

// ---- Hook ----

export function useWidgets(): UseWidgetsReturn {
  const [widgets, setWidgets] = useState<WidgetRecord[]>(load);

  const [dragSensitivity, setDragSensitivity_internal] = useState<number>(() => {
    try {
      const s = localStorage.getItem(DRAG_KEY);
      return s ? parseFloat(s) : 1.0;
    } catch { return 1.0; }
  });

  const [activeSettingsId, setActiveSettingsId] = useState<string | null>(null);

  /** 通用 patch：修改指定 id 并持久化 */
  const patch = useCallback((id: string, p: Partial<WidgetRecord>) => {
    setWidgets(prev => {
      const next = prev.map(w => w.id === id ? { ...w, ...p } : w);
      save(next);
      return next;
    });
  }, []);

  const addWidget = useCallback((type: WidgetType) => {
    setWidgets(prev => {
      if (prev.length >= MAX_WIDGETS) return prev;
      const w    = makeWidget(type, prev.length);
      const next = [...prev, w];
      save(next);
      return next;
    });
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets(prev => {
      const next = prev.filter(w => w.id !== id);
      save(next);
      return next;
    });
  }, []);

  const updateWidget = useCallback((id: string, p: Partial<WidgetRecord>) => patch(id, p), [patch]);

  const resetPositions = useCallback(() => {
    setWidgets(prev => {
      const L = getCurrentLayout();
      const seen: Partial<Record<WidgetType, number>> = {};
      const next = prev.map(w => {
        const idx    = seen[w.type] ?? 0;
        seen[w.type] = idx + 1;
        const slots  = L[w.type];
        const slot   = slots[Math.min(idx, slots.length - 1)];
        return { ...w, x: slot.x, y: slot.y, scale: slot.scale, rotation: 0, opacity: 1 };
      });
      save(next);
      return next;
    });
  }, []);

  const setDragSensitivity = useCallback((v: number) => {
    setDragSensitivity_internal(v);
    try { localStorage.setItem(DRAG_KEY, v.toString()); } catch { /* ignore */ }
  }, []);

  // ---- 计时器操作 ----

  const startTimer = useCallback((id: string) => {
    patch(id, { status: 'running', startTs: Date.now() });
  }, [patch]);

  const pauseTimer = useCallback((id: string) => {
    setWidgets(prev => {
      const w = prev.find(x => x.id === id);
      if (!w || w.status !== 'running') return prev;
      const acc  = w.accumulated + Math.max(0, Date.now() - w.startTs);
      const next = prev.map(x => x.id === id ? { ...x, status: 'paused' as TimerStatus, accumulated: acc } : x);
      save(next);
      return next;
    });
  }, []);

  const resetTimer = useCallback((id: string) => {
    patch(id, { status: 'idle', accumulated: 0, startTs: 0 });
  }, [patch]);

  const finishTimer = useCallback((id: string) => {
    patch(id, { status: 'finished' });
  }, [patch]);

  const setTimerMode = useCallback((id: string, mode: TimerMode) => {
    patch(id, { mode, status: 'idle', accumulated: 0, startTs: 0 });
  }, [patch]);

  const setTimerCountdownTarget = useCallback((id: string, ms: number) => {
    patch(id, { countdownTarget: ms });
  }, [patch]);

  return {
    widgets,
    dragSensitivity,
    activeSettingsId,
    setActiveSettingsId,
    addWidget,
    removeWidget,
    updateWidget,
    resetPositions,
    setDragSensitivity,
    startTimer,
    pauseTimer,
    resetTimer,
    finishTimer,
    setTimerMode,
    setTimerCountdownTarget,
  };
}
