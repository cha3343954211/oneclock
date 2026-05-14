import { useState, useEffect } from 'react';
import { LayoutConfig, ElementConfig } from '../types';

const DEFAULT_LAYOUT: LayoutConfig = {
  digitalClock: { id: 'digitalClock', x: 0, y: -20, scale: 1, rotation: 0, zIndex: 10, visible: true, opacity: 1, customColor: null },
  analogClock:  { id: 'analogClock',  x: 0, y: 0,   scale: 0.8, rotation: 0, zIndex: 8,  visible: true, opacity: 1, customColor: null },
  dateLine:     { id: 'dateLine',     x: 0, y: 25,  scale: 1, rotation: 0, zIndex: 5,  visible: true, opacity: 1, customColor: null },
};

function loadLayout(): LayoutConfig {
  try {
    const saved = localStorage.getItem('zenclock_layout_config');
    if (!saved) return DEFAULT_LAYOUT;
    const parsed: LayoutConfig = JSON.parse(saved);
    // 迁移：旧数据范围越界或缺少 opacity 字段时重置
    if (
      Math.abs(parsed.dateLine?.y) > 50 ||
      parsed.digitalClock?.zIndex === undefined ||
      parsed.digitalClock?.opacity === undefined
    ) {
      localStorage.removeItem('zenclock_layout_config');
      return DEFAULT_LAYOUT;
    }
    return parsed;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

function loadDragSensitivity(): number {
  try {
    const saved = localStorage.getItem('zenclock_drag_sensitivity');
    return saved ? parseFloat(saved) : 1.0;
  } catch {
    return 1.0;
  }
}

export interface UseLayoutReturn {
  layout: LayoutConfig;
  dragSensitivity: number;
  activeSettingsId: string | null;
  setActiveSettingsId: (id: string | null) => void;
  updateElement: (id: string, patch: Partial<ElementConfig>) => void;
  resetLayout: () => void;
  setLayerOrder: (elementId: string, zIndex: number) => void;
  setDragSensitivity: (value: number) => void;
}

export function useLayout(): UseLayoutReturn {
  const [layout, setLayout] = useState<LayoutConfig>(loadLayout);
  const [dragSensitivity, setDragSensitivity_internal] = useState<number>(loadDragSensitivity);
  const [activeSettingsId, setActiveSettingsId] = useState<string | null>(null);

  // 持久化布局
  useEffect(() => {
    localStorage.setItem('zenclock_layout_config', JSON.stringify(layout));
  }, [layout]);

  // 持久化灵敏度
  useEffect(() => {
    localStorage.setItem('zenclock_drag_sensitivity', dragSensitivity.toString());
  }, [dragSensitivity]);

  const updateElement = (id: string, patch: Partial<ElementConfig>) => {
    setLayout(prev => ({
      ...prev,
      [id]: { ...prev[id as keyof LayoutConfig], ...patch },
    }));
  };

  const resetLayout = () => {
    setLayout(prev => ({
      digitalClock: { ...prev.digitalClock, x: 0, y: -20, scale: 1, rotation: 0, opacity: 1 },
      analogClock:  { ...prev.analogClock,  x: 0, y: 0,   scale: 0.8, rotation: 0, opacity: 1 },
      dateLine:     { ...prev.dateLine,     x: 0, y: 25,  scale: 1, rotation: 0, opacity: 1 },
    }));
  };

  const setLayerOrder = (elementId: string, zIndex: number) => {
    setLayout(prev => ({
      ...prev,
      [elementId]: { ...prev[elementId as keyof LayoutConfig], zIndex },
    }));
  };

  const setDragSensitivity = (value: number) => {
    setDragSensitivity_internal(value);
  };

  return {
    layout,
    dragSensitivity,
    activeSettingsId,
    setActiveSettingsId,
    updateElement,
    resetLayout,
    setLayerOrder,
    setDragSensitivity,
  };
}
