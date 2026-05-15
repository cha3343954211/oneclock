
import React, { useRef, useState } from 'react';
import {
  Maximize,
  Type,
  Clock,
  Sparkles,
  Palette,
  Image as ImageIcon,
  X,
  Snowflake,
  Camera,
  CameraOff,
  RefreshCcw,
  Timer,
  TimerOff,
  LayoutTemplate,
  Bot,
  Settings2,
  Key,
  Link as LinkIcon,
  Cpu,
  ChevronDown,
  ChevronUp,
  Quote,
  AlarmClock,
  CalendarDays,
  Plus,
} from 'lucide-react';
import { ParticleMode, AIConfig, AIProvider, WidgetType } from '../types';
import { THEMES, COLOR_PRESETS } from '../constants';
import { WIDGET_LABELS } from '../hooks/useWidgets';
import { useSettingsContext } from '../contexts/SettingsContext';

/** Controls 现在只需要 2 个外部 props（回调需要在 App 层执行的逻辑） */
interface ControlsProps {
  onGenerateWisdom: () => void;
  onUploadBackground: (file: File) => void;
}

export const Controls: React.FC<ControlsProps> = ({ onGenerateWisdom, onUploadBackground }) => {
  const { settings, widgets: widgetsCtx, isGeneratingWisdom, controlsVisible, setControlsVisible } = useSettingsContext();
  const { widgets, dragSensitivity, setDragSensitivity, resetPositions, updateWidget, addWidget } = widgetsCtx;

  const {
    themeId, particleMode, showSeconds, use24Hour,
    isCameraEnabled, customBackground,
    showWisdom, aiConfig,
    setThemeId, setParticleMode,
    toggleSeconds, toggle24Hour,
    toggleCamera, toggleWisdom, clearBackground, setAiConfig,
  } = settings;

  const fileInputRef   = useRef<HTMLInputElement>(null);
  const [showAISettings, setShowAISettings] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else if (document.exitFullscreen)  document.exitFullscreen();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onUploadBackground(file);
    if (event.target) event.target.value = '';
  };

  const handleAIConfigChange = (key: keyof AIConfig, value: string) => {
    setAiConfig({ ...aiConfig, [key]: value });
  };

  // 各类型的图标（仅用于添加组件按钮，不包含图层排列）
  const WIDGET_ICONS: Record<WidgetType, React.ReactNode> = {
    digital:  <Type size={14} />,
    analog:   <Clock size={14} />,
    calendar: <CalendarDays size={14} />,
    timer:    <AlarmClock size={14} />,
  };

  const handleProviderChange = (provider: AIProvider) => {
    const defaults: Record<string, { baseUrl: string; model: string }> = {
      modelscope: { baseUrl: 'https://api-inference.modelscope.cn/v1', model: 'qwen-turbo' },
      gemini:     { baseUrl: '', model: 'gemini-3-flash-preview' },
    };
    const d = defaults[provider] ?? { baseUrl: aiConfig.baseUrl, model: aiConfig.model };
    setAiConfig({ ...aiConfig, provider, baseUrl: d.baseUrl, model: d.model });
  };


  return (
    <div
      className={`fixed top-12 left-1/2 -translate-x-1/2 p-4 flex flex-col items-center justify-start transition-all duration-500 z-50 ${controlsVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-8 pointer-events-none'}`}
    >
      <div className="bg-black/80 backdrop-blur-2xl border border-white/20 rounded-2xl p-5 shadow-[0_10px_50px_rgba(0,0,0,0.6)] flex flex-col gap-4 w-[90vw] max-w-lg transform transition-transform duration-300 max-h-[85vh] overflow-y-auto scrollbar-hide">

        {/* ── 顶栏：全局开关 ── */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          {/* 左侧：时钟开关 */}
          <div className="flex gap-1 items-center flex-wrap">
            <button onClick={toggleSeconds}
              className={`p-2 rounded-xl transition-all ${showSeconds ? 'bg-white/14 text-white ring-1 ring-white/20 shadow-inner' : 'text-white/40 hover:text-white/75 hover:bg-white/8'}`}
              title={showSeconds ? '隐藏秒' : '显示秒'}
            >{showSeconds ? <Timer size={15} /> : <TimerOff size={15} />}</button>

            <button onClick={toggle24Hour}
              className={`px-2 py-1.5 rounded-xl transition-all text-[10px] font-mono font-bold leading-none ${use24Hour ? 'bg-white/14 text-white ring-1 ring-white/20 shadow-inner' : 'text-white/40 hover:text-white/75 hover:bg-white/8'}`}
              title={use24Hour ? '切换到 12小时制' : '切换到 24小时制'}
            >{use24Hour ? '24H' : '12H'}</button>
          </div>

          {/* 右侧：其他功能 */}
          <div className="flex gap-1.5 items-center">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            {customBackground ? (
              <button onClick={clearBackground}
                className="p-2 text-red-300 hover:text-red-200 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                title="移除自定义背景"
              ><X size={16} /></button>
            ) : (
              <button onClick={() => fileInputRef.current?.click()}
                className="p-2 text-white/50 hover:text-white transition-colors"
                title="上传自定义背景"
              ><ImageIcon size={16} /></button>
            )}

            <button onClick={toggleWisdom}
              className={`p-2 transition-all rounded-lg ${showWisdom ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
              title={showWisdom ? '隐藏每日格言' : '显示每日格言'}
            ><Quote size={16} /></button>

            <button onClick={toggleCamera}
              className={`p-2 transition-all rounded-lg ${isCameraEnabled ? 'bg-red-500/20 text-red-200 animate-pulse' : 'text-white/50 hover:text-white'}`}
              title={isCameraEnabled ? '关闭手势识别' : '开启手势识别'}
            >{isCameraEnabled ? <CameraOff size={16} /> : <Camera size={16} />}</button>

            <button onClick={toggleFullscreen}
              className="p-2 text-white/50 hover:text-white transition-colors"
              title="全屏"
            ><Maximize size={16} /></button>
          </div>
        </div>

        <div className="h-[1px] bg-white/10 w-full" />

        {/* ── 添加组件 ── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-wider font-medium">
            <Plus size={12} />
            <span>添加组件</span>
            <span className="ml-auto text-white/20 normal-case tracking-normal font-normal">{widgets.length}/12</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(['digital', 'analog', 'calendar', 'timer'] as WidgetType[]).map(type => (
              <button
                key={type}
                onClick={() => addWidget(type)}
                disabled={widgets.length >= 12}
                className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 text-white/60 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                title={`添加${WIDGET_LABELS[type]}`}
              >
                {WIDGET_ICONS[type]}
                <span className="text-[10px] leading-tight">{WIDGET_LABELS[type]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-[1px] bg-white/10 w-full" />

        {/* ── 布局控制 ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-wider font-medium">
            <LayoutTemplate size={12} />
            <span>布局控制</span>
          </div>

          {/* 拖动灵敏度 */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-white/50">拖动灵敏度: {dragSensitivity.toFixed(2)}x</label>
            <input type="range" min={0.1} max={1} step={0.05} value={dragSensitivity}
              onChange={e => setDragSensitivity(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <button onClick={resetPositions}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl flex items-center justify-center gap-2 text-sm transition-all"
            title="将所有组件归位到预设的美观默认排版"
          >
            <RefreshCcw size={14} />
            默认排版复位
          </button>
        </div>

        <div className="h-[1px] bg-white/10 w-full" />

        {/* ── 主题 ── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-wider font-medium">
            <Palette size={12} />
            <span>Themes</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {Object.values(THEMES).map(theme => (
              <button key={theme.id} onClick={() => setThemeId(theme.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap transition-all border ${themeId === theme.id ? 'bg-white text-black border-white' : 'bg-transparent text-white/60 border-white/20 hover:border-white/50'}`}
              >{theme.label}</button>
            ))}
          </div>
        </div>

        {/* ── 粒子 ── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-wider font-medium">
            <Snowflake size={12} />
            <span>Particles</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: ParticleMode.NONE, label: 'None' }, { id: ParticleMode.SNOW, label: 'Snow' },
              { id: ParticleMode.RAIN, label: 'Rain' }, { id: ParticleMode.STARS, label: 'Stars' },
              { id: ParticleMode.MATRIX, label: 'Matrix' },
            ].map(pm => (
              <button key={pm.id} onClick={() => setParticleMode(pm.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap transition-all border ${particleMode === pm.id ? 'bg-blue-500 text-white border-blue-400' : 'bg-transparent text-white/60 border-white/20 hover:border-white/50'}`}
              >{pm.label}</button>
            ))}
          </div>
        </div>

        {/* ── AI ── */}
        <div className="flex flex-col gap-3 mt-1">
          <button onClick={onGenerateWisdom} disabled={isGeneratingWisdom}
            className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
          >
            <Sparkles size={16} className={isGeneratingWisdom ? 'animate-spin' : ''} />
            {isGeneratingWisdom ? 'Consulting...' : 'Ask AI for Reflection'}
          </button>

          <button onClick={() => setShowAISettings(!showAISettings)}
            className="flex items-center justify-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors w-full py-1"
          >
            <Settings2 size={12} />
            <span>AI Settings</span>
            {showAISettings ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showAISettings && (
            <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-white/40 uppercase tracking-wider font-medium flex items-center gap-1">
                  <Bot size={10} /> Provider
                </label>
                <select value={aiConfig.provider} onChange={e => handleProviderChange(e.target.value as AIProvider)}
                  className="bg-black/40 border border-white/10 rounded-lg text-xs text-white px-2 py-1.5 focus:outline-none focus:border-white/30"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="modelscope">ModelScope (魔搭)</option>
                  <option value="custom">Custom (OpenAI Compatible)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-white/40 uppercase tracking-wider font-medium flex items-center gap-1">
                  <Key size={10} /> API Key
                </label>
                <input type="password" value={aiConfig.apiKey}
                  onChange={e => handleAIConfigChange('apiKey', e.target.value)}
                  placeholder={aiConfig.provider === 'gemini' ? 'Optional' : 'Required'}
                  className="bg-black/40 border border-white/10 rounded-lg text-xs text-white px-2 py-1.5 focus:outline-none focus:border-white/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-white/40 uppercase tracking-wider font-medium flex items-center gap-1">
                  <Cpu size={10} /> Model
                </label>
                <input type="text" value={aiConfig.model}
                  onChange={e => handleAIConfigChange('model', e.target.value)}
                  placeholder="e.g. gemini-pro"
                  className="bg-black/40 border border-white/10 rounded-lg text-xs text-white px-2 py-1.5 focus:outline-none focus:border-white/30"
                />
              </div>
              {aiConfig.provider !== 'gemini' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider font-medium flex items-center gap-1">
                    <LinkIcon size={10} /> API Base URL
                  </label>
                  <input type="text" value={aiConfig.baseUrl}
                    onChange={e => handleAIConfigChange('baseUrl', e.target.value)}
                    placeholder="https://api..."
                    className="bg-black/40 border border-white/10 rounded-lg text-xs text-white px-2 py-1.5 focus:outline-none focus:border-white/30"
                  />
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
