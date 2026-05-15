import { WidgetType } from '../types';

// ── 字体预设（数字时钟 + 计时器）──────────────────────────────────────────

export interface FontPreset {
  key: string;
  label: string;
  family: string;    // CSS font-family 字符串，空串 = 跟随主题
}

export const FONT_PRESETS: FontPreset[] = [
  { key: 'default',  label: '默认',   family: '' },
  { key: 'orbitron', label: '科幻',   family: "'Orbitron', sans-serif" },
  { key: 'mono',     label: '等宽',   family: "'Share Tech Mono', 'Courier New', monospace" },
  { key: 'bebas',    label: '粗犷',   family: "'Bebas Neue', Impact, sans-serif" },
  { key: 'serif',    label: '典雅',   family: "'Playfair Display', Georgia, serif" },
  { key: 'rajdhani', label: '现代',   family: "'Rajdhani', 'Segoe UI', sans-serif" },
  { key: 'zen',      label: 'Zen',    family: "'Zen Dots', sans-serif" },
];

/** 根据 key 获取 font-family 字符串 */
export function resolveFontFamily(key: string | undefined, themeFontFam: string): string {
  if (!key || key === 'default') return themeFontFam;
  return FONT_PRESETS.find(f => f.key === key)?.family || themeFontFam;
}

// ── 数字时钟 / 计时器 样式预设 ────────────────────────────────────────────

export interface StylePreset {
  key: string;
  label: string;
}

/** 数字时钟展示风格（含动画变体）*/
export const DIGITAL_STYLE_PRESETS: StylePreset[] = [
  { key: 'text',  label: '极简'  },
  { key: 'card',  label: '卡片'  },
  { key: 'glow',  label: '光晕'  },
  { key: 'neon',  label: '霓虹'  },
  { key: 'flip',  label: '翻牌'  },   // 3D 翻页动画（数字时钟专用）
  { key: 'slide', label: '滑动'  },
  { key: 'fade',  label: '渐隐'  },
];

/** 计时器展示风格（不含逐位动画，计时器为整体字符串）*/
export const TIMER_STYLE_PRESETS: StylePreset[] = [
  { key: 'text',  label: '极简'  },
  { key: 'card',  label: '卡片'  },
  { key: 'glow',  label: '光晕'  },
  { key: 'neon',  label: '霓虹'  },
];

// ── 圆形时钟 表盘风格 ─────────────────────────────────────────────────────

export const ANALOG_FACE_PRESETS: StylePreset[] = [
  { key: 'classic', label: '经典' },   // 默认：刻度线 + 指针
  { key: 'minimal', label: '极简' },   // 无刻度、无表圈，纯指针
  { key: 'dots',    label: '点状' },   // 圆点刻度
  { key: 'modern',  label: '现代' },   // 进度弧 + 粗指针
  { key: 'swiss',   label: '瑞士' },   // 瑞士火车站风格
];

// ── 日历 布局风格 ─────────────────────────────────────────────────────────

export const CALENDAR_STYLE_PRESETS: StylePreset[] = [
  { key: 'text',     label: '文本' },   // 一行文字（默认）
  { key: 'badge',    label: '徽章' },   // 胶囊形玻璃底
  { key: 'card',     label: '卡片' },   // 大号日期卡片
  { key: 'expanded', label: '详细' },   // 多行展开：星期 + 日期 + 月年
];

// ── 工具：按组件类型返回对应预设集合 ────────────────────────────────────

export function getStylePresetsForType(type: WidgetType): StylePreset[] {
  switch (type) {
    case 'digital':  return DIGITAL_STYLE_PRESETS;
    case 'timer':    return TIMER_STYLE_PRESETS;
    case 'analog':   return ANALOG_FACE_PRESETS;
    case 'calendar': return CALENDAR_STYLE_PRESETS;
  }
}

export function hasFontPreset(type: WidgetType): boolean {
  return type === 'digital' || type === 'timer';
}
