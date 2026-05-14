import React, { createContext, useContext } from 'react';
import { UseSettingsReturn } from '../hooks/useSettings';
import { UseLayoutReturn } from '../hooks/useLayout';

/**
 * SettingsContext - 全局设置状态
 *
 * 消除 Controls.tsx 的 36 个 props，改为就近消费 context。
 * App.tsx 只需调用 useSettings() 和 useLayout() 并挂载到此 Provider。
 */

interface SettingsContextValue {
  settings: UseSettingsReturn;
  layoutCtx: UseLayoutReturn;
  /** AI Wisdom 相关 */
  wisdom: string;
  setWisdom: (text: string) => void;
  isGeneratingWisdom: boolean;
  setIsGeneratingWisdom: (loading: boolean) => void;
  /** Controls 面板开关 */
  controlsVisible: boolean;
  setControlsVisible: (visible: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider: React.FC<{
  value: SettingsContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
);

export function useSettingsContext(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettingsContext must be used within SettingsProvider');
  return ctx;
}
