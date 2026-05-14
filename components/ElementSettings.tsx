import React, { useState, useEffect } from 'react';
import { ElementConfig } from '../types';
import { COLOR_PRESETS } from '../constants';

interface ElementSettingsProps {
    isOpen: boolean;
    elementId: string;
    elementLabel: string;
    config: ElementConfig;
    onConfigChange: (config: Partial<ElementConfig>) => void;
    onClose: () => void;
    onReset: () => void;
}

export const ElementSettings: React.FC<ElementSettingsProps> = ({
    isOpen,
    elementId,
    elementLabel,
    config,
    onConfigChange,
    onClose,
    onReset
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

    const handlePositionXChange = (value: number) => {
        onConfigChange({ x: value });
    };

    const handlePositionYChange = (value: number) => {
        onConfigChange({ y: value });
    };

    const handleScaleChange = (value: number) => {
        onConfigChange({ scale: value });
    };

    const handleColorSelect = (color: string | null) => {
        onConfigChange({ customColor: color });
    };

    const handleCustomHexChange = (hex: string) => {
        setCustomHex(hex);
        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            onConfigChange({ customColor: hex });
        }
    };

    const handleVisibilityToggle = () => {
        onConfigChange({ visible: !config.visible });
    };

    const isCustomHex = config.customColor && !config.customColor.includes('gradient') && !COLOR_PRESETS.some(p => p.value === config.customColor);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="bg-neutral-900/95 rounded-2xl p-6 w-[90vw] max-w-md shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">{elementLabel} 设置</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Position X */}
                <div className="mb-4">
                    <label className="block text-sm text-white/70 mb-2">
                        水平位置: {config.x.toFixed(0)}%
                    </label>
                    <input
                        type="range"
                        min={-50}
                        max={50}
                        step={1}
                        value={config.x}
                        onChange={(e) => handlePositionXChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                {/* Position Y */}
                <div className="mb-4">
                    <label className="block text-sm text-white/70 mb-2">
                        垂直位置: {config.y.toFixed(0)}%
                    </label>
                    <input
                        type="range"
                        min={-50}
                        max={50}
                        step={1}
                        value={config.y}
                        onChange={(e) => handlePositionYChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                {/* Scale */}
                <div className="mb-4">
                    <label className="block text-sm text-white/70 mb-2">
                        大小: {(config.scale * 100).toFixed(0)}%
                    </label>
                    <input
                        type="range"
                        min={0.2}
                        max={3}
                        step={0.1}
                        value={config.scale}
                        onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                {/* Rotation */}
                <div className="mb-4">
                    <label className="block text-sm text-white/70 mb-2">
                        旋转: {(config.rotation || 0).toFixed(0)}°
                    </label>
                    <input
                        type="range"
                        min={-180}
                        max={180}
                        step={1}
                        value={config.rotation || 0}
                        onChange={(e) => onConfigChange({ rotation: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                {/* Opacity */}
                <div className="mb-6">
                    <label className="block text-sm text-white/70 mb-2">
                        透明度: {((config.opacity ?? 1) * 100).toFixed(0)}%
                    </label>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={config.opacity ?? 1}
                        onChange={(e) => onConfigChange({ opacity: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                {/* Color Selection */}
                <div className="mb-6">
                    <label className="block text-sm text-white/70 mb-3">颜色</label>

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

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onReset}
                        className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                    >
                        重置
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
                    >
                        完成
                    </button>
                </div>
            </div>
        </div>
    );
};
