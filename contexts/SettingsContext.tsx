import React, { createContext, useContext } from 'react';
import { UseSettingsReturn } from '../hooks/useSettings';
import { UseWidgetsReturn } from '../hooks/useWidgets';

/**
 * SettingsContext - 全局设置状态
 *
 * widgets 统一承载原先的 layoutCtx + timers 两个 context 值。
 */

interface SettingsContextValue {
  settings: UseSettingsReturn;
  widgets: UseWidgetsReturn;
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
