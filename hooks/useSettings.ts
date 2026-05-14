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

function loadAIConfig(): AIConfig {
  try {
    const saved = localStorage.getItem('zenclock_ai_config');
    return saved ? JSON.parse(saved) : DEFAULT_AI_CONFIG;
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

export function useSettings(): UseSettingsReturn {
  const [themeId, setThemeId] = useState<ThemeId>(ThemeId.MINIMAL_DARK);
  const [clockMode, setClockMode] = useState<ClockMode>(ClockMode.DIGITAL);
  const [particleMode, setParticleMode] = useState<ParticleMode>(ParticleMode.NONE);
  const [showSeconds, setShowSeconds] = useState(true);
  const [use24Hour, setUse24Hour] = useState(false);
  const [isSmooth, setIsSmooth] = useState(false);
  const [isFlip, setIsFlip] = useState(false);
  const [showHourNumbers, setShowHourNumbers] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [showWisdom, setShowWisdom] = useState(true);
  const [customColor, setCustomColor] = useState<string | null>(null);
  const [customFont, setCustomFont] = useState<string | null>(null);
  const [customBackground, setCustomBackground_internal] = useState<string | null>(null);
  const [aiConfig, setAiConfig] = useState<AIConfig>(loadAIConfig);

  // 持久化 AI 配置
  useEffect(() => {
    localStorage.setItem('zenclock_ai_config', JSON.stringify(aiConfig));
  }, [aiConfig]);

  // 切换主题时清空 wisdom
  const handleSetThemeId = (id: ThemeId) => {
    setThemeId(id);
  };

  const setCustomBackground = (url: string | null) => {
    setCustomBackground_internal(url);
  };

  const clearBackground = () => {
    if (customBackground) URL.revokeObjectURL(customBackground);
    setCustomBackground_internal(null);
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
