
export enum ClockMode {
  DIGITAL = 'DIGITAL',
  ANALOG = 'ANALOG',
  DUAL = 'DUAL',
}

export enum ThemeId {
  MINIMAL_DARK = 'MINIMAL_DARK',
  MINIMAL_LIGHT = 'MINIMAL_LIGHT',
  NEON_CYBERPUNK = 'NEON_CYBERPUNK',
  FOREST_GLASS = 'FOREST_GLASS',
  TERMINAL_RETRO = 'TERMINAL_RETRO'
}

export enum ParticleMode {
  NONE = 'NONE',
  SNOW = 'SNOW',
  STARS = 'STARS',
  RAIN = 'RAIN',
  MATRIX = 'MATRIX'
}

export interface ThemeConfig {
  id: ThemeId;
  label: string;
  bgClass: string;
  textClass: string;
  accentClass: string;
  fontFamily: string; // Tailwind class like 'font-sans'
  backgroundImage?: string;
}

export interface TimeState {
  hours: number;
  minutes: number;
  seconds: number;
  period: 'AM' | 'PM';
  fullDate: string;
}

/** 计时器模式 */
export type TimerMode = 'stopwatch' | 'countdown';

/** 计时器状态 */
export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export type AIProvider = 'gemini' | 'modelscope' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ElementConfig {
  id: string;
  x: number;        // X offset from center (percentage)
  y: number;        // Y offset from center (percentage)
  scale: number;    // Scale factor
  rotation: number; // Rotation in degrees
  zIndex: number;   // Layer order (higher = on top)
  visible: boolean; // Whether visible
  opacity: number;  // Opacity (0-1)
  customColor: string | null; // Element-specific color
}

export interface LayoutConfig {
  digitalClock: ElementConfig;
  analogClock: ElementConfig;
  dateLine: ElementConfig;
}

/** 组件类型 */
export type WidgetType = 'digital' | 'analog' | 'calendar' | 'timer';

/**
 * 统一组件记录 — 同时满足 ElementConfig（位置/视觉）和 TimerRecord（计时状态）
 * 的超集，可直接传入 DraggableElement / TimerDisplay / ElementSettings。
 */
export interface WidgetRecord {
  id: string;
  type: WidgetType;
  name: string;
  // Layout — 与 ElementConfig 字段完全一致
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
  visible: boolean;
  opacity: number;
  customColor: string | null;
  // Timer state — 始终存在，仅 type==='timer' 时有意义
  mode: TimerMode;
  status: TimerStatus;
  accumulated: number;   // 上次暂停前已累计 ms
  startTs: number;       // 最近一次 start 的 Date.now()
  countdownTarget: number;
  // 样式预设（可选，未设时跟随全局）
  fontPreset?: string;        // digital/timer: 字体预设 key
  stylePreset?: string;       // digital/timer: 展示风格 | analog: 表盘风格 | calendar: 布局风格
  // Analog 专属（未设时 = undefined，App 层回退到全局设置）
  isSmooth?: boolean;
  showHourNumbers?: boolean;
  // Digital 专属
  showDate?: boolean;
}
