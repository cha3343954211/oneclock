import React, { useState, useRef, lazy, Suspense } from 'react';
import { THEMES } from './constants';
import { ClockMode, ParticleMode } from './types';
import { DigitalClock } from './components/DigitalClock';
import { TimerDisplay } from './components/TimerDisplay';
import { Controls } from './components/Controls';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DraggableElement } from './components/DraggableElement';
import { ElementSettings } from './components/ElementSettings';
import { DateLine } from './components/DateLine';
import { generateTimeReflection } from './services/geminiService';
import { useSettings } from './hooks/useSettings';
import { useLayout } from './hooks/useLayout';
import { useTimers } from './hooks/useTimers';
import { SettingsProvider } from './contexts/SettingsContext';
import type { TimerActions } from './components/TimerDisplay';

// 代码分割：仅在需要时加载
const AnalogClock = lazy(() => import('./components/AnalogClock').then(m => ({ default: m.AnalogClock })));
const ParticlesCanvas = lazy(() => import('./components/ParticlesCanvas').then(m => ({ default: m.ParticlesCanvas })));

// 元素 ID → 中文标签
const ELEMENT_LABELS: Record<string, string> = {
  digitalClock: '数字时钟',
  analogClock: '圆形时钟',
  dateLine: '日期显示',
};

const App: React.FC = () => {
  const settings = useSettings();
  const layoutCtx = useLayout();
  const timers = useTimers();
  const containerRef = useRef<HTMLDivElement>(null);

  const [wisdom, setWisdom] = useState('');
  const [isGeneratingWisdom, setIsGeneratingWisdom] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  // 双击计时器 → 打开 ElementSettings
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);

  const currentTheme = THEMES[settings.themeId];
  const { layout, dragSensitivity, activeSettingsId, setActiveSettingsId, updateElement } = layoutCtx;

  const handleGenerateWisdom = async () => {
    if (isGeneratingWisdom) return;
    setIsGeneratingWisdom(true);
    const now = new Date();
    const h = now.getHours();
    const timeString = `${h}:${now.getMinutes().toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    const result = await generateTimeReflection(timeString, currentTheme.label, settings.aiConfig);
    setWisdom(result);
    setIsGeneratingWisdom(false);
  };

  const handleUploadBackground = (file: File) => {
    settings.setCustomBackground(URL.createObjectURL(file));
  };

  const renderClockElements = () => {
    const { clockMode, showSeconds, use24Hour, isSmooth, isFlip, showHourNumbers, customColor, customFont } = settings;
    const items = [];

    if (clockMode === ClockMode.DIGITAL || clockMode === ClockMode.DUAL) {
      items.push(
        <DraggableElement key="digitalClock" id="digitalClock" config={layout.digitalClock}
          onConfigChange={updateElement} onDoubleClick={setActiveSettingsId}
          containerRef={containerRef} dragSensitivity={dragSensitivity}>
          <DigitalClock theme={currentTheme} showSeconds={showSeconds} use24Hour={use24Hour}
            customColor={layout.digitalClock.customColor || customColor}
            customFont={customFont} isFlip={isFlip} compact={clockMode === ClockMode.DUAL} showDate={false} />
        </DraggableElement>
      );
    }

    if (clockMode === ClockMode.ANALOG || clockMode === ClockMode.DUAL) {
      items.push(
        <DraggableElement key="analogClock" id="analogClock" config={layout.analogClock}
          onConfigChange={updateElement} onDoubleClick={setActiveSettingsId}
          containerRef={containerRef} dragSensitivity={dragSensitivity}>
          <Suspense fallback={null}>
            <AnalogClock theme={currentTheme} showSeconds={showSeconds}
              customColor={layout.analogClock.customColor || customColor}
              customFont={customFont} isSmooth={isSmooth} showHourNumbers={showHourNumbers} />
          </Suspense>
        </DraggableElement>
      );
    }

    items.push(
      <DraggableElement key="dateLine" id="dateLine" config={layout.dateLine}
        onConfigChange={updateElement} onDoubleClick={setActiveSettingsId}
        containerRef={containerRef} dragSensitivity={dragSensitivity}>
        <DateLine theme={currentTheme} use24Hour={use24Hour}
          customColor={layout.dateLine.customColor || customColor} customFont={customFont} />
      </DraggableElement>
    );

    return items;
  };

  const activeElementConfig = activeSettingsId ? layout[activeSettingsId as keyof typeof layout] : null;

  // 为每个计时器绑定 id 的操作集
  const makeTimerActions = (id: string): TimerActions => ({
    start:               () => timers.start(id),
    pause:               () => timers.pause(id),
    reset:               () => timers.reset(id),
    finish:              () => timers.finish(id),
    setMode:             m  => timers.setMode(id, m),
    setCountdownTarget:  ms => timers.setCountdownTarget(id, ms),
    updateVisual:        p  => timers.updateVisual(id, p),
    remove:              () => timers.removeTimer(id),
  });

  const activeTimerRecord = activeTimerId ? timers.timers.find(t => t.id === activeTimerId) : null;

  return (
    <SettingsProvider value={{ settings, layoutCtx, timers, wisdom, setWisdom, isGeneratingWisdom, setIsGeneratingWisdom, controlsVisible, setControlsVisible }}>
      <div
        ref={containerRef}
        className={`relative w-full h-screen overflow-hidden transition-colors duration-700 ease-in-out flex flex-col items-center justify-center ${currentTheme.bgClass}`}
      >
        {/* 背景图层 */}
        {(settings.customBackground || currentTheme.backgroundImage) && (
          <div
            className={`absolute inset-0 bg-cover bg-center z-0 transition-all duration-1000 ${settings.customBackground ? 'opacity-100' : 'opacity-40 mix-blend-overlay'}`}
            style={{ backgroundImage: `url(${settings.customBackground || currentTheme.backgroundImage})` }}
          />
        )}
        {settings.customBackground && <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />}

        {/* 粒子系统 - 按需加载 */}
        {settings.particleMode !== ParticleMode.NONE && (
          <ErrorBoundary fallback={null}>
            <Suspense fallback={null}>
              <ParticlesCanvas mode={settings.particleMode} theme={currentTheme} isCameraEnabled={settings.isCameraEnabled} />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* 顶部触发条 */}
        <div
          className={`absolute top-0 left-0 w-full h-24 z-40 cursor-pointer flex justify-center items-start pt-2 group transition-all duration-300 ${controlsVisible ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
          onClick={() => setControlsVisible(true)}
        >
          <div className="w-32 h-1 bg-white/10 rounded-full group-hover:bg-white/40 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
        </div>

        {/* 蒙层 */}
        {controlsVisible && (
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={() => setControlsVisible(false)} />
        )}

        {/* 可拖拽元素层 */}
        <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
          <div className="relative w-full h-full pointer-events-auto">
            {renderClockElements()}
          </div>
        </div>

        {/* AI Wisdom 显示 */}
        <div className="absolute bottom-12 w-full px-4 z-10 pointer-events-none">
          <div className={`max-w-2xl mx-auto text-center transition-all duration-1000 ${wisdom && settings.showWisdom ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p
              className={`text-xl md:text-2xl font-light italic leading-relaxed whitespace-pre-line ${!settings.customColor ? currentTheme.accentClass : ''} ${!settings.customFont ? currentTheme.fontFamily : ''}`}
              style={{ color: settings.customColor || undefined, fontFamily: settings.customFont || undefined, opacity: settings.customColor ? 0.8 : undefined }}
            >
              {wisdom}
            </p>
          </div>
        </div>

        {/* 元素设置弹窗 */}
        {activeSettingsId && activeElementConfig && (
          <ElementSettings
            isOpen
            elementId={activeSettingsId}
            elementLabel={ELEMENT_LABELS[activeSettingsId] ?? '元素'}
            config={activeElementConfig}
            onConfigChange={patch => updateElement(activeSettingsId, patch)}
            onClose={() => setActiveSettingsId(null)}
            onReset={() => updateElement(activeSettingsId, { x: 0, y: 0, scale: 1, rotation: 0, visible: true, opacity: 1, customColor: null })}
          />
        )}

        {/* 计时器列表 - 每个独立可拖拽 */}
        {timers.timers.map(t => (
          <DraggableElement
            key={t.id}
            id={t.id}
            config={{ id: t.id, x: t.x, y: t.y, scale: t.scale, rotation: t.rotation, zIndex: t.zIndex, visible: true, opacity: t.opacity, customColor: t.customColor }}
            onConfigChange={(id, p) => timers.updateVisual(id, p)}
            onDoubleClick={id => setActiveTimerId(id)}
            containerRef={containerRef}
            dragSensitivity={layoutCtx.dragSensitivity}
          >
            <TimerDisplay timer={t} actions={makeTimerActions(t.id)} />
          </DraggableElement>
        ))}

        {/* ElementSettings 弹窗 - 计时器双击 */}
        {activeTimerId && activeTimerRecord && (
          <ElementSettings
            isOpen
            elementId={activeTimerId}
            elementLabel={activeTimerRecord.name}
            config={{ id: activeTimerId, x: activeTimerRecord.x, y: activeTimerRecord.y, scale: activeTimerRecord.scale, rotation: activeTimerRecord.rotation, zIndex: activeTimerRecord.zIndex, visible: true, opacity: activeTimerRecord.opacity, customColor: activeTimerRecord.customColor }}
            onConfigChange={p => timers.updateVisual(activeTimerId, p)}
            onClose={() => setActiveTimerId(null)}
            onReset={() => timers.updateVisual(activeTimerId, { x: 0, y: 10, scale: 1, rotation: 0, opacity: 1 })}
          />
        )}

        {/* 设置面板 - 通过 Context 消费，不需要传 props */}
        <Controls onGenerateWisdom={handleGenerateWisdom} onUploadBackground={handleUploadBackground} />
      </div>
    </SettingsProvider>
  );
};

export default App;
