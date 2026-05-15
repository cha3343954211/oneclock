import React, { useReducer, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, AlarmClock, X } from 'lucide-react';
import { TimerMode, WidgetRecord } from '../types';
import { calcDisplayMs, formatMs, playAlertTone } from '../hooks/useWidgets';
import { resolveFontFamily } from '../hooks/widgetPresets';

/** 判断是否渐变色 */
const isGradientColor = (c: string | null) => !!c && c.includes('gradient');

/** 生成渐变文字的 CSS style（backgroundClip: text 技术）*/
function gradientTextStyle(gradient: string): React.CSSProperties {
  return {
    color: 'transparent',
    backgroundImage: gradient,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  };
}

/** customColor 为 null 时，用 rgba(255,255,255,0.X) 降级白色 */
const tint = (color: string | null, alpha = 1) =>
  color && !isGradientColor(color)
    ? color + (alpha < 1 ? Math.round(alpha * 255).toString(16).padStart(2, '0') : '')
    : undefined;

// ---- 倒计时输入 ----
const CountdownInput: React.FC<{
  targetMs: number;
  onChange: (ms: number) => void;
  accentColor: string | null;
}> = ({ targetMs, onChange, accentColor }) => {
  const total = Math.floor(targetMs / 1000);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  // 渐变色无法直接用于 color 属性，input 内部退回白色
  const solidColor = accentColor && !isGradientColor(accentColor) ? accentColor : null;
  const borderStyle = solidColor ? { borderColor: solidColor + '60' } : {};
  const inputCls = 'w-12 text-center bg-white/10 border border-white/20 rounded-lg text-white text-lg font-mono focus:outline-none py-1';
  return (
    <div className="flex items-center justify-center gap-1">
      <input type="number" min={0} max={99} value={mins}
        onChange={e => onChange((clamp(parseInt(e.target.value) || 0, 0, 99) * 60 + secs) * 1000)}
        className={inputCls} style={{ color: solidColor || undefined, ...borderStyle }} />
      <span className="text-white/50 text-xl font-mono" style={{ color: solidColor || undefined }}>:</span>
      <input type="number" min={0} max={59} value={String(secs).padStart(2, '0')}
        onChange={e => onChange((mins * 60 + clamp(parseInt(e.target.value) || 0, 0, 59)) * 1000)}
        className={inputCls} style={{ color: solidColor || undefined, ...borderStyle }} />
      <span className="text-white/30 text-xs ml-1">分:秒</span>
    </div>
  );
};

// ---- 操作集（由 App.tsx 绑定 id 后传入）----
export interface TimerActions {
  start: () => void;
  pause: () => void;
  reset: () => void;
  finish: () => void;
  setMode: (mode: TimerMode) => void;
  setCountdownTarget: (ms: number) => void;
  updateVisual: (patch: Partial<WidgetRecord>) => void;
  remove: () => void;
}

interface TimerDisplayProps {
  timer: WidgetRecord;
  actions: TimerActions;
}

// ---- 主组件 ----
export const TimerDisplay: React.FC<TimerDisplayProps> = ({ timer, actions }) => {
  const { mode, status, accumulated, startTs, countdownTarget, customColor, name, fontPreset, stylePreset } = timer;
  const isStopwatch = mode === 'stopwatch';
  const isRunning   = status === 'running';
  const isFinished  = status === 'finished';

  // 仅 TimerDisplay 自身的局部 tick（50ms），不影响外层组件树
  const [, forceUpdate] = useReducer(n => n + 1, 0);
  const hasFinishedRef = useRef(false);
  const actionsRef     = useRef(actions);
  actionsRef.current   = actions;

  useEffect(() => {
    if (status === 'running') hasFinishedRef.current = false;
    if (status !== 'running') return;

    const id = window.setInterval(() => {
      if (hasFinishedRef.current) return;
      const elapsed = accumulated + Math.max(0, Date.now() - startTs);
      if (mode === 'countdown' && elapsed >= countdownTarget) {
        hasFinishedRef.current = true;
        actionsRef.current.finish();
        playAlertTone();
      } else {
        forceUpdate();
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [status, mode, accumulated, startTs, countdownTarget]);

  const displayMs = calcDisplayMs(timer);

  // 时间显示颜色（支持渐变）
  const isGradient = isGradientColor(customColor);
  const timeColorStyle: React.CSSProperties = isFinished
    ? {}
    : customColor
      ? isGradient
        ? gradientTextStyle(customColor)
        : { color: customColor }
      : {};

  // 若设置了自定义颜色，不让倒计时警告色覆盖
  const timeColorClass = isFinished
    ? 'text-red-400 animate-pulse'
    : customColor
      ? ''
      : !isStopwatch && displayMs <= 10_000
        ? 'text-amber-400'
        : !isStopwatch && displayMs <= 60_000
          ? 'text-yellow-200'
          : 'text-white';

  // 字体预设
  const fontFam = resolveFontFamily(fontPreset, "'Share Tech Mono', 'Courier New', monospace");

  // 展示风格
  const displayStyle = stylePreset || 'text';
  const solidColor = customColor && !isGradient ? customColor : null;
  const glowBase = solidColor || '#ffffff';
  const glowStyle: React.CSSProperties = !isGradient
    ? displayStyle === 'glow'
      ? { textShadow: `0 0 24px ${glowBase}70, 0 0 48px ${glowBase}38` }
      : displayStyle === 'neon'
        ? { textShadow: `0 0 8px ${glowBase}, 0 0 18px ${glowBase}cc, 0 0 36px ${glowBase}88, 0 0 72px ${glowBase}44` }
        : {}
    : {};

  const cardWrapStyle: React.CSSProperties = displayStyle === 'card' ? {
    background:     'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(14px)',
    border:         '1px solid rgba(255,255,255,0.10)',
    boxShadow:      '0 8px 32px rgba(0,0,0,0.30)',
    borderRadius:   16,
    padding:        '10px 24px',
  } : {};

  const canSwitchMode = status !== 'running';

  return (
    <div className="flex flex-col items-center select-none" style={{ minWidth: 180 }}>

      {/* ── 倒计时目标输入（仅 idle 时，浮于时间上方）── */}
      {!isStopwatch && status === 'idle' && (
        <div className="mb-2">
          <CountdownInput targetMs={countdownTarget} onChange={ms => actions.setCountdownTarget(ms)} accentColor={customColor} />
        </div>
      )}

      {/* ── 主时间显示（字体/样式预设生效）── */}
      <div style={cardWrapStyle}>
        <div
          className={`font-bold tracking-tight ${timeColorClass}`}
          style={{
            fontFamily:     fontFam,
            fontSize:       'clamp(2.4rem, 7vw, 5rem)',
            letterSpacing:  '-0.03em',
            lineHeight:     1,
            fontVariantNumeric: 'tabular-nums',
            ...timeColorStyle,
            ...glowStyle,
          }}
        >
          {isFinished ? '完成!' : formatMs(displayMs, isStopwatch)}
        </div>
      </div>

      {/* ── 倒计时进度条（细线，与字体同色）── */}
      {!isStopwatch && !isFinished && countdownTarget > 0 && (
        <div className="w-full h-px mt-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${Math.max(0, (displayMs / countdownTarget) * 100)}%`,
              background: customColor ?? 'rgba(255,255,255,0.5)',
            }}
          />
        </div>
      )}

      {/* ── 工具栏（小号透明行，悬停显现）── */}
      <div className="flex items-center gap-0.5 mt-2 opacity-40 hover:opacity-90 transition-opacity duration-200">

        {/* 模式切换 —— 激活态用 customColor 着色 */}
        <button
          onClick={() => canSwitchMode && actions.setMode('stopwatch')}
          className={`flex items-center gap-0.5 px-1.5 py-1 rounded text-[10px] font-medium transition-all
            ${!canSwitchMode ? 'cursor-not-allowed' : ''}`}
          style={{ color: isStopwatch ? (tint(customColor) ?? 'white') : 'rgba(255,255,255,0.45)' }}
          title="正计时"
        >
          <Timer size={9} />秒
        </button>

        <button
          onClick={() => canSwitchMode && actions.setMode('countdown')}
          className={`flex items-center gap-0.5 px-1.5 py-1 rounded text-[10px] font-medium transition-all
            ${!canSwitchMode ? 'cursor-not-allowed' : ''}`}
          style={{ color: !isStopwatch ? (tint(customColor) ?? 'white') : 'rgba(255,255,255,0.45)' }}
          title="倒计时"
        >
          <AlarmClock size={9} />倒
        </button>

        <span className="w-px h-3 bg-white/20 mx-0.5" />

        {/* 重置 */}
        <button onClick={actions.reset}
          className="p-1 text-white/60 hover:text-white transition-colors rounded"
          title="重置">
          <RotateCcw size={11} />
        </button>

        {/* 开始 / 暂停 —— 激活态用 customColor */}
        <button
          onClick={isRunning ? actions.pause : actions.start}
          disabled={isFinished}
          className={`p-1 transition-colors rounded ${isFinished ? 'cursor-not-allowed opacity-40' : ''}`}
          style={{ color: isRunning ? (tint(customColor) ?? 'white') : 'rgba(255,255,255,0.6)' }}
          title={isRunning ? '暂停' : '开始'}
        >
          {isRunning ? <Pause size={11} /> : <Play size={11} />}
        </button>

        <span className="w-px h-3 bg-white/20 mx-0.5" />

        {/* 关闭 */}
        <button onClick={actions.remove}
          className="p-1 text-white/40 hover:text-white/90 transition-colors rounded"
          title="移除">
          <X size={10} />
        </button>
      </div>

      {/* ── 双击提示（极弱，仅占位）── */}
      <span className="text-[9px] text-white/15 mt-1">双击自定义颜色 / 大小</span>

    </div>
  );
};
