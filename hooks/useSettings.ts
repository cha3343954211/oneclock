import { useState, useEffect } from 'react';
import { ThemeId, ClockMode, ParticleMode, AIConfig } from '../types';

export interface SettingsState {
  // 外观
  themeId: ThemeId;
  customColor: string | null;
  customFont: string | null;
  customBackground: string | null;
  // 时钟模式
  clockMode: ClockMode;
  particleMode: ParticleMode;
  // 时钟开关
  showSeconds: boolean;
  use24Hour: boolean;
  isSmooth: boolean;
  isFlip: boolean;
  showHourNumbers: boolean;
  // 其他
  isCameraEnabled: boolean;
  showWisdom: boolean;
  // AI
  aiConfig: AIConfig;
}

export interface SettingsActions {
  setThemeId: (id: ThemeId) => void;
  setClockMode: (mode: ClockMode) => void;
  setParticleMode: (mode: ParticleMode) => void;
  toggleSeconds: () => void;
  toggle24Hour: () => void;
  toggleSmooth: () => void;
  toggleFlip: () => void;
  toggleHourNumbers: () => void;
  toggleCamera: () => void;
  toggleWisdom: () => void;
  setCustomColor: (color: string | null) => void;
  setCustomFont: (font: string | null) => void;
  setCustomBackground: (bg: string | null) => void;
  clearBackground: () => void;
  resetStyle: () => void;
  setAiConfig: (config: AIConfig) => void;
}

export type UseSettingsReturn = SettingsState & SettingsActions;

const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'gemini',
  apiKey: '',
  baseUrl: '',
  model: 'gemini-3-flash-preview',
};

// 全量设置持久化键（除 customBackground 外，后者是 ObjectURL 不能跨会话复用）
const KEYS = {
  THEME:           'for_clock_theme_id',
  CLOCK_MODE:      'for_clock_clock_mode',
  PARTICLE_MODE:   'for_clock_particle_mode',
  SHOW_SECONDS:    'for_clock_show_seconds',
  USE_24H:         'for_clock_use_24h',
  IS_SMOOTH:       'for_clock_is_smooth',
  IS_FLIP:         'for_clock_is_flip',
  HOUR_NUMBERS:    'for_clock_hour_numbers',
  CAMERA:          'for_clock_camera',
  SHOW_WISDOM:     'for_clock_show_wisdom',
  CUSTOM_COLOR:    'for_clock_custom_color',
  CUSTOM_FONT:     'for_clock_custom_font',
  AI_CONFIG:       'for_clock_ai_config',
} as const;

/** 安全读取 localStorage，失败 / 不存在时返回默认值 */
function loadJSON<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s !== null ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* 隐私模式 / 配额超限时静默 */ }
}

export function useSettings(): UseSettingsReturn {
  // 从 localStorage 延迟初始化所有偏好
  const [themeId, setThemeId]                   = useState<ThemeId>(    () => loadJSON(KEYS.THEME,         ThemeId.MINIMAL_DARK));
  const [clockMode, setClockMode]               = useState<ClockMode>(  () => loadJSON(KEYS.CLOCK_MODE,    ClockMode.DIGITAL));
  const [particleMode, setParticleMode]         = useState<ParticleMode>(() => loadJSON(KEYS.PARTICLE_MODE, ParticleMode.NONE));
  const [showSeconds, setShowSeconds]           = useState<boolean>(    () => loadJSON(KEYS.SHOW_SECONDS,  true));
  const [use24Hour, setUse24Hour]               = useState<boolean>(    () => loadJSON(KEYS.USE_24H,       false));
  const [isSmooth, setIsSmooth]                 = useState<boolean>(    () => loadJSON(KEYS.IS_SMOOTH,     false));
  const [isFlip, setIsFlip]                     = useState<boolean>(    () => loadJSON(KEYS.IS_FLIP,       false));
  const [showHourNumbers, setShowHourNumbers]   = useState<boolean>(    () => loadJSON(KEYS.HOUR_NUMBERS,  false));
  const [isCameraEnabled, setIsCameraEnabled]   = useState<boolean>(    () => loadJSON(KEYS.CAMERA,        false));
  const [showWisdom, setShowWisdom]             = useState<boolean>(    () => loadJSON(KEYS.SHOW_WISDOM,   true));
  const [customColor, setCustomColor]           = useState<string | null>(() => loadJSON(KEYS.CUSTOM_COLOR, null));
  const [customFont, setCustomFont]             = useState<string | null>(() => loadJSON(KEYS.CUSTOM_FONT,  null));
  // customBackground 是 Blob ObjectURL，会话间失效，不持久化
  const [customBackground, setCustomBackground_internal] = useState<string | null>(null);
  const [aiConfig, setAiConfig]                 = useState<AIConfig>(   () => loadJSON(KEYS.AI_CONFIG,     DEFAULT_AI_CONFIG));

  // 持久化——一状态一 effect，避免任意字段变动重复序列化所有
  useEffect(() => { saveJSON(KEYS.THEME,         themeId);         }, [themeId]);
  useEffect(() => { saveJSON(KEYS.CLOCK_MODE,    clockMode);       }, [clockMode]);
  useEffect(() => { saveJSON(KEYS.PARTICLE_MODE, particleMode);    }, [particleMode]);
  useEffect(() => { saveJSON(KEYS.SHOW_SECONDS,  showSeconds);     }, [showSeconds]);
  useEffect(() => { saveJSON(KEYS.USE_24H,       use24Hour);       }, [use24Hour]);
  useEffect(() => { saveJSON(KEYS.IS_SMOOTH,     isSmooth);        }, [isSmooth]);
  useEffect(() => { saveJSON(KEYS.IS_FLIP,       isFlip);          }, [isFlip]);
  useEffect(() => { saveJSON(KEYS.HOUR_NUMBERS,  showHourNumbers); }, [showHourNumbers]);
  useEffect(() => { saveJSON(KEYS.CAMERA,        isCameraEnabled); }, [isCameraEnabled]);
  useEffect(() => { saveJSON(KEYS.SHOW_WISDOM,   showWisdom);      }, [showWisdom]);
  useEffect(() => { saveJSON(KEYS.CUSTOM_COLOR,  customColor);     }, [customColor]);
  useEffect(() => { saveJSON(KEYS.CUSTOM_FONT,   customFont);      }, [customFont]);
  useEffect(() => { saveJSON(KEYS.AI_CONFIG,     aiConfig);        }, [aiConfig]);

  const handleSetThemeId = (id: ThemeId) => {
    setThemeId(id);
  };

  // 上传新背景时，释放上一张的 ObjectURL，防止内存泄漏
  const setCustomBackground = (url: string | null) => {
    setCustomBackground_internal(prev => {
      if (prev && prev !== url && prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return url;
    });
  };

  const clearBackground = () => {
    setCustomBackground_internal(prev => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const resetStyle = () => {
    setCustomColor(null);
    setCustomFont(null);
  };

  return {
    // State
    themeId,
    clockMode,
    particleMode,
    showSeconds,
    use24Hour,
    isSmooth,
    isFlip,
    showHourNumbers,
    isCameraEnabled,
    showWisdom,
    customColor,
    customFont,
    customBackground,
    aiConfig,
    // Actions
    setThemeId: handleSetThemeId,
    setClockMode,
    setParticleMode,
    toggleSeconds: () => setShowSeconds(v => !v),
    toggle24Hour: () => setUse24Hour(v => !v),
    toggleSmooth: () => setIsSmooth(v => !v),
    toggleFlip: () => setIsFlip(v => !v),
    toggleHourNumbers: () => setShowHourNumbers(v => !v),
    toggleCamera: () => setIsCameraEnabled(v => !v),
    toggleWisdom: () => setShowWisdom(v => !v),
    setCustomColor,
    setCustomFont,
    setCustomBackground,
    clearBackground,
    resetStyle,
    setAiConfig,
  };
}
