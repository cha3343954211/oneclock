import React, { useState, useRef, lazy, Suspense } from 'react';
import { THEMES, FOREST_BG_FALLBACK } from './constants';
import { ParticleMode, WidgetType } from './types';
import { DigitalClock } from './components/DigitalClock';
import { TimerDisplay } from './components/TimerDisplay';
import { Controls } from './components/Controls';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DraggableElement } from './components/DraggableElement';
import { ElementSettings } from './components/ElementSettings';
import { DateLine } from './components/DateLine';
import { generateTimeReflection } from './services/geminiService';
import { useSettings } from './hooks/useSettings';
import { useWidgets, WIDGET_LABELS } from './hooks/useWidgets';
import { SettingsProvider } from './contexts/SettingsContext';
import type { TimerActions } from './components/TimerDisplay';

// 代码分割：仅在需要时加载
const AnalogClock   = lazy(() => import('./components/AnalogClock').then(m => ({ default: m.AnalogClock })));
const ParticlesCanvas = lazy(() => import('./components/ParticlesCanvas').then(m => ({ default: m.ParticlesCanvas })));

const App: React.FC = () => {
  const settings     = useSettings();
  const widgetsCtx   = useWidgets();
  const containerRef = useRef<HTMLDivElement>(null);

  const [forestBgError, setForestBgError]           = useState(false);
  const [wisdom, setWisdom]                         = useState('');
  const [isGeneratingWisdom, setIsGeneratingWisdom] = useState(false);
  const [controlsVisible, setControlsVisible]       = useState(false);

  const currentTheme = THEMES[settings.themeId];
  const {
    widgets,
    dragSensitivity,
    activeSettingsId,
    setActiveSettingsId,
    updateWidget,
    removeWidget,
  } = widgetsCtx;

  const handleGenerateWisdom = async () => {
    if (isGeneratingWisdom) return;
    setIsGeneratingWisdom(true);
    const now = new Date();
    const h   = now.getHours();
    const timeString = `${h}:${now.getMinutes().toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    const result = await generateTimeReflection(timeString, currentTheme.label, settings.aiConfig);
    setWisdom(result);
    setIsGeneratingWisdom(false);
  };

  const handleUploadBackground = (file: File) => {
    settings.setCustomBackground(URL.createObjectURL(file));
  };

  // 为每个 timer widget 绑定操作集
  const makeTimerActions = (id: string): TimerActions => ({
    start:              () => widgetsCtx.startTimer(id),
    pause:              () => widgetsCtx.pauseTimer(id),
    reset:              () => widgetsCtx.resetTimer(id),
    finish:             () => widgetsCtx.finishTimer(id),
    setMode:            m  => widgetsCtx.setTimerMode(id, m),
    setCountdownTarget: ms => widgetsCtx.setTimerCountdownTarget(id, ms),
    updateVisual:       p  => updateWidget(id, p),
    remove:             () => removeWidget(id),
  });

  const { showSeconds, use24Hour, isSmooth, isFlip, showHourNumbers, customColor, customFont } = settings;

  /** 按 widget type 渲染对应组件内容 */
  const renderWidgetContent = (w: typeof widgets[number]) => {
    const effectiveColor = w.customColor || customColor;
    switch (w.type as WidgetType) {
      case 'digital':
        return (
          <DigitalClock
            theme={currentTheme}
            showSeconds={showSeconds}
            use24Hour={use24Hour}
            customColor={effectiveColor}
            customFont={customFont}
            isFlip={isFlip}
            showDate={w.showDate ?? false}
            fontPreset={w.fontPreset}
            stylePreset={w.stylePreset}
          />
        );
      case 'analog':
        return (
          <Suspense fallback={null}>
            <AnalogClock
              theme={currentTheme}
              showSeconds={showSeconds}
              customColor={effectiveColor}
              customFont={customFont}
              isSmooth={w.isSmooth ?? isSmooth}
              showHourNumbers={w.showHourNumbers ?? showHourNumbers}
              faceStyle={w.stylePreset}
            />
          </Suspense>
        );
      case 'calendar':
        return (
          <DateLine
            theme={currentTheme}
            use24Hour={use24Hour}
            customColor={effectiveColor}
            customFont={customFont}
            layoutStyle={w.stylePreset}
          />
        );
      case 'timer':
        return <TimerDisplay timer={w} actions={makeTimerActions(w.id)} />;
    }
  };

  const activeWidget = activeSettingsId
    ? widgets.find(w => w.id === activeSettingsId)
    : null;

  return (
    <SettingsProvider value={{
      settings, widgets: widgetsCtx,
      wisdom, setWisdom,
      isGeneratingWisdom, setIsGeneratingWisdom,
      controlsVisible, setControlsVisible,
    }}>
      <div
        ref={containerRef}
        className={`relative w-full h-screen overflow-hidden transition-colors duration-700 ease-in-out flex flex-col items-center justify-center ${currentTheme.bgClass}`}
      >
        {/* 背景图层 */}
        {(settings.customBackground || currentTheme.backgroundImage) && (() => {
          const bgUrl = settings.customBackground
            || (forestBgError ? FOREST_BG_FALLBACK : currentTheme.backgroundImage);
          return (
            <>
              <div
                className={`absolute inset-0 bg-cover bg-center z-0 transition-all duration-1000 ${settings.customBackground ? 'opacity-100' : 'opacity-40 mix-blend-overlay'}`}
                style={{ backgroundImage: `url(${bgUrl})` }}
              />
              {!settings.customBackground && currentTheme.backgroundImage && (
                <img
                  src={currentTheme.backgroundImage}
                  className="hidden"
                  onError={() => setForestBgError(true)}
                  onLoad={() => setForestBgError(false)}
                  alt=""
                />
              )}
            </>
          );
        })()}
        {settings.customBackground && (
          <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />
        )}

        {/* 粒子系统 */}
        {settings.particleMode !== ParticleMode.NONE && (
          <ErrorBoundary fallback={null}>
            <Suspense fallback={null}>
              <ParticlesCanvas
                mode={settings.particleMode}
                theme={currentTheme}
                isCameraEnabled={settings.isCameraEnabled}
              />
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

        {/* 统一 widget 渲染层 */}
        <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
          <div className="relative w-full h-full pointer-events-auto">
            {widgets.map(w => (
              <DraggableElement
                key={w.id}
                id={w.id}
                config={w}
                onConfigChange={(id, p) => updateWidget(id, p)}
                onDoubleClick={id => setActiveSettingsId(id)}
                containerRef={containerRef}
                dragSensitivity={dragSensitivity}
              >
                {renderWidgetContent(w)}
              </DraggableElement>
            ))}
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

        {/* 统一 ElementSettings 弹窗 — 双击任意 widget 打开 */}
        {activeWidget && (
          <ElementSettings
            isOpen
            elementId={activeWidget.id}
            elementLabel={WIDGET_LABELS[activeWidget.type]}
            config={activeWidget}
            onConfigChange={p => updateWidget(activeWidget.id, p)}
            onClose={() => setActiveSettingsId(null)}
            onReset={() => updateWidget(activeWidget.id, { x: 0, y: 0, scale: 1, rotation: 0, visible: true, opacity: 1, customColor: null })}
            onDelete={() => removeWidget(activeWidget.id)}
            widgetStyle={{
              widgetType:      activeWidget.type,
              fontPreset:      activeWidget.fontPreset,
              stylePreset:     activeWidget.stylePreset,
              isSmooth:        activeWidget.isSmooth ?? isSmooth,
              showHourNumbers: activeWidget.showHourNumbers ?? showHourNumbers,
              onFontPresetChange:       key => updateWidget(activeWidget.id, { fontPreset: key }),
              onStylePresetChange:      key => updateWidget(activeWidget.id, { stylePreset: key }),
              onIsSmoothChange:         v   => updateWidget(activeWidget.id, { isSmooth: v }),
              onShowHourNumbersChange:  v   => updateWidget(activeWidget.id, { showHourNumbers: v }),
            }}
            layerProps={{
              zIndex:      activeWidget.zIndex,
              allZIndexes: widgets.map(w => w.zIndex),
              onLayerChange: z => updateWidget(activeWidget.id, { zIndex: z }),
            }}
          />
        )}

        {/* 设置面板 */}
        <Controls onGenerateWisdom={handleGenerateWisdom} onUploadBackground={handleUploadBackground} />
      </div>
    </SettingsProvider>
  );
};

export default App;
