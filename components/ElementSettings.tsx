import React, { useState, useEffect } from 'react';
import { ElementConfig, WidgetType } from '../types';
import { COLOR_PRESETS } from '../constants';
import {
  FONT_PRESETS,
  getStylePresetsForType, hasFontPreset,
} from '../hooks/widgetPresets';

interface WidgetStyleConfig {
  widgetType: WidgetType;
  fontPreset?: string;
  stylePreset?: string;
  onFontPresetChange?: (key: string) => void;
  onStylePresetChange?: (key: string) => void;
  // analog 专属
  isSmooth?: boolean;
  showHourNumbers?: boolean;
  onIsSmoothChange?: (v: boolean) => void;
  onShowHourNumbersChange?: (v: boolean) => void;
}

interface LayerProps {
  zIndex: number;
  allZIndexes: number[];
  onLayerChange: (z: number) => void;
}

interface ElementSettingsProps {
    isOpen: boolean;
    elementId: string;
    elementLabel: string;
    config: ElementConfig;
    onConfigChange: (config: Partial<ElementConfig>) => void;
    onClose: () => void;
    onReset: () => void;
    onDelete?: () => void;
    /** 组件样式预设（字体、展示风格等）*/
    widgetStyle?: WidgetStyleConfig;
    /** 图层排列 */
    layerProps?: LayerProps;
}

export const ElementSettings: React.FC<ElementSettingsProps> = ({
    isOpen,
    elementId,
    elementLabel,
    config,
    onConfigChange,
    onClose,
    onReset,
    onDelete,
    widgetStyle,
    layerProps,
}) => {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [customHex, setCustomHex] = useState(
        config.customColor && !config.customColor.includes('gradient')
            ? config.customColor
            : '#ffffff'
    );

    // 外部 customColor 变更时同步（例如通过预设色选择后，自定义输入框也应更新）
    useEffect(() => {
        if (config.customColor && !config.customColor.includes('gradient')) {
            setCustomHex(config.customColor);
        }
    }, [config.customColor]);

    if (!isOpen) return null;

    const handleColorSelect = (color: string | null) => {
        onConfigChange({ customColor: color });
    };

    const handleCustomHexChange = (hex: string) => {
        setCustomHex(hex);
        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            onConfigChange({ customColor: hex });
        }
    };

    const isCustomHex = config.customColor && !config.customColor.includes('gradient') && !COLOR_PRESETS.some(p => p.value === config.customColor);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d0d1a]/97"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="bg-[#0d0d1a]/97 rounded-2xl p-6 w-[90vw] max-w-md shadow-[0_24px_80px_rgba(0,0,0,0.75)] ring-1 ring-white/10 overflow-y-auto max-h-[92vh] scrollbar-hide"
                style={{ animation: 'modal-pop 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <style>{`@keyframes modal-pop{from{opacity:0;transform:scale(0.94) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
                {/* ── Widget Style Presets ── */}
                {widgetStyle && (
                  <div className="mb-5 pb-5 border-b border-white/10">

                    {/* Font Presets (digital / timer only) */}
                    {hasFontPreset(widgetStyle.widgetType) && (
                      <div className="mb-4">
                        <label className="block text-sm text-white/60 mb-2">字体</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {FONT_PRESETS.map(fp => (
                            <button
                              key={fp.key}
                              onClick={() => widgetStyle.onFontPresetChange?.(fp.key)}
                              className={`py-2 rounded-xl text-center text-[11px] border transition-all ${
                                (widgetStyle.fontPreset || 'default') === fp.key
                                  ? 'bg-white/20 text-white border-white/40 shadow-inner'
                                  : 'bg-white/5 text-white/55 border-white/10 hover:bg-white/12'
                              }`}
                            >
                              <div
                                className="font-bold leading-tight"
                                style={{ fontFamily: fp.family || undefined }}
                              >
                                {fp.key === 'default' ? '默认' : '01:23'}
                              </div>
                              <div className="text-[9px] mt-0.5 opacity-70">{fp.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Style Presets */}
                    <div>
                      <label className="block text-sm text-white/60 mb-2">样式</label>
                      <div className="flex flex-wrap gap-1.5">
                        {getStylePresetsForType(widgetStyle.widgetType).map(sp => (
                          <button
                            key={sp.key}
                            onClick={() => widgetStyle.onStylePresetChange?.(sp.key)}
                            className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                              (widgetStyle.stylePreset || '') === sp.key
                                ? 'bg-white/20 text-white border-white/40'
                                : 'bg-white/5 text-white/55 border-white/10 hover:bg-white/12'
                            }`}
                          >
                            {sp.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Analog 专属开关 */}
                    {widgetStyle.widgetType === 'analog' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => widgetStyle.onIsSmoothChange?.(!widgetStyle.isSmooth)}
                          className={`flex-1 py-2 rounded-xl text-xs border transition-all ${
                            widgetStyle.isSmooth
                              ? 'bg-white/20 text-white border-white/40'
                              : 'bg-white/5 text-white/55 border-white/10 hover:bg-white/12'
                          }`}
                        >
                          平滑扫秒
                        </button>
                        <button
                          onClick={() => widgetStyle.onShowHourNumbersChange?.(!widgetStyle.showHourNumbers)}
                          className={`flex-1 py-2 rounded-xl text-xs border transition-all ${
                            widgetStyle.showHourNumbers
                              ? 'bg-white/20 text-white border-white/40'
                              : 'bg-white/5 text-white/55 border-white/10 hover:bg-white/12'
                          }`}
                        >
                          数字标记
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-lg font-semibold text-white tracking-tight">{elementLabel}</h3>
                      <div className="h-px w-8 mt-1 rounded-full" style={{ background: 'linear-gradient(90deg,#6366f1,transparent)' }} />
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/6 hover:bg-white/14 text-white/50 hover:text-white transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 透明度 */}
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] text-white/40 uppercase tracking-wider font-medium">透明度</span>
                    <span className="text-[11px] text-white/65 font-mono tabular-nums">{((config.opacity ?? 1) * 100).toFixed(0)}%</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.05} value={config.opacity ?? 1}
                    onChange={e => onConfigChange({ opacity: parseFloat(e.target.value) })}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-400"
                    style={{ background: `linear-gradient(90deg,rgba(99,102,241,0.75) 0%,rgba(99,102,241,0.75) ${(config.opacity??1)*100}%,rgba(255,255,255,0.12) ${(config.opacity??1)*100}%,rgba(255,255,255,0.12) 100%)` }}
                  />
                </div>

                {/* Color Selection */}
                <div className="mb-5">
                    <label className="block text-[11px] text-white/40 uppercase tracking-wider font-medium mb-3">颜色</label>

                    {/* Preset Colors */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {/* Default/Theme Color */}
                        <button
                            onClick={() => handleColorSelect(null)}
                            className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center
                ${config.customColor === null ? 'border-white scale-110' : 'border-white/30 hover:border-white/60'}
              `}
                            title="默认主题颜色"
                        >
                            <span className="text-xs text-white/70">默认</span>
                        </button>

                        {/* Preset Buttons */}
                        {COLOR_PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => handleColorSelect(preset.value)}
                                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110
                  ${config.customColor === preset.value ? 'border-white scale-110' : 'border-transparent'}
                `}
                                style={{
                                    background: preset.value
                                }}
                                title={preset.label}
                            />
                        ))}

                        {/* Custom Color Button */}
                        <button
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center
                ${isCustomHex ? 'border-white' : 'border-white/30 hover:border-white/60'}
              `}
                            style={{
                                background: isCustomHex ? config.customColor || '#fff' : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'
                            }}
                            title="自定义颜色"
                        >
                            {!isCustomHex && <span className="text-xs">+</span>}
                        </button>
                    </div>

                    {/* Custom Hex Input */}
                    {showColorPicker && (
                        <div className="flex gap-2 items-center mt-3 p-3 bg-white/5 rounded-lg">
                            <input
                                type="color"
                                value={customHex}
                                onChange={(e) => handleCustomHexChange(e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={customHex}
                                onChange={(e) => handleCustomHexChange(e.target.value)}
                                placeholder="#RRGGBB"
                                className="flex-1 bg-white/10 text-white px-3 py-2 rounded-lg text-sm font-mono"
                            />
                        </div>
                    )}
                </div>

                {/* ── 图层排列 ── */}
                {layerProps && (() => {
                  const maxZ = Math.max(...layerProps.allZIndexes);
                  const minZ = Math.min(...layerProps.allZIndexes);
                  const cur  = layerProps.zIndex;
                  return (
                    <div className="mb-5 pb-5 border-b border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-white/60">图层排列</label>
                        <span className="text-[11px] text-white/30">当前层: {cur}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { label: '移到底部', disabled: cur <= minZ, z: () => Math.max(1, minZ - 1) },
                          { label: '下移一层', disabled: cur <= 1,    z: () => Math.max(1, cur - 1)  },
                          { label: '上移一层', disabled: false,        z: () => cur + 1               },
                          { label: '移到顶部', disabled: cur >= maxZ,  z: () => maxZ + 1              },
                        ].map(({ label, disabled, z }) => (
                          <button
                            key={label}
                            onClick={() => layerProps.onLayerChange(z())}
                            disabled={disabled}
                            className={`py-2 rounded-xl text-[11px] border transition-all ${
                              disabled
                                ? 'bg-white/3 text-white/25 border-white/8 cursor-not-allowed'
                                : 'bg-white/5 text-white/70 border-white/15 hover:bg-white/15 hover:text-white'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                    {onDelete && (
                        <button
                            onClick={() => { onDelete(); onClose(); }}
                            className="px-3.5 py-2.5 rounded-xl text-red-400/80 hover:text-red-300 bg-red-500/8 hover:bg-red-500/18 text-sm font-medium transition-all active:scale-95"
                            title="删除此组件"
                        >删除</button>
                    )}
                    <button
                        onClick={onReset}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/55 hover:text-white bg-white/6 hover:bg-white/12 transition-all active:scale-95"
                    >重置</button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                    >完成</button>
                </div>
            </div>
        </div>
    );
};
