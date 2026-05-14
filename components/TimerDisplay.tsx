import React, { useReducer, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, AlarmClock, X } from 'lucide-react';
import { TimerMode } from '../types';
import { TimerRecord, VisualPatch, calcDisplayMs, formatMs, playAlertTone } from '../hooks/useTimers';

// ---- 倒计时输入 ----
const CountdownInput: React.FC<{ targetMs: number; onChange: (ms: number) => void }> = ({ targetMs, onChange }) => {
  const total = Math.floor(targetMs / 1000);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  return (
    <div className="flex items-center justify-center gap-1">
      <input type="number" min={0} max={99} value={mins}
        onChange={e => onChange((clamp(parseInt(e.target.value) || 0, 0, 99) * 60 + secs) * 1000)}
        className="w-12 text-center bg-white/10 border border-white/20 rounded-lg text-white text-lg font-mono focus:outline-none focus:border-white/50 py-1" />
      <span className="text-white/50 text-xl font-mono">:</span>
      <input type="number" min={0} max={59} value={String(secs).padStart(2, '0')}
        onChange={e => onChange((mins * 60 + clamp(parseInt(e.target.value) || 0, 0, 59)) * 1000)}
        className="w-12 text-center bg-white/10 border border-white/20 rounded-lg text-white text-lg font-mono focus:outline-none focus:border-white/50 py-1" />
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
  updateVisual: (patch: VisualPatch) => void;
  remove: () => void;
}

interface TimerDisplayProps {
  timer: TimerRecord;
  actions: TimerActions;
}

// ---- 主组件 ----
export const TimerDisplay: React.FC<TimerDisplayProps> = ({ timer, actions }) => {
  const { mode, status, accumulated, startTs, countdownTarget, customColor, name } = timer;
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

  // 快捷颜色选择器
  const colorInputRef = useRef<HTMLInputElement>(null);

  // 时间显示颜色
  const timeColorStyle: React.CSSProperties = isFinished
    ? {}
    : customColor
      ? { color: customColor }
      : {};
  const timeColorClass = isFinished
    ? 'text-red-400 animate-pulse'
    : !isStopwatch && displayMs <= 10_000
      ? 'text-amber-400'
      : !isStopwatch && displayMs <= 60_000
        ? 'text-yellow-200'
        : customColor ? '' : 'text-white';

  const canSwitchMode = status !== 'running';

  return (
    <div className="flex flex-col items-center select-none" style={{ minWidth: 180 }}>

      {/* ── 倒计时目标输入（仅 idle 时，浮于时间上方）── */}
      {!isStopwatch && status === 'idle' && (
        <div className="mb-2">
          <CountdownInput targetMs={countdownTarget} onChange={ms => actions.setCountdownTarget(ms)} />
        </div>
      )}

      {/* ── 主时间显示（与 DigitalClock 同风格）── */}
      <div
        className={`font-mono font-bold tracking-tight ${timeColorClass}`}
        style={{
          fontSize: 'clamp(2.4rem, 7vw, 5rem)',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          ...timeColorStyle,
        }}
      >
        {isFinished ? '完成!' : formatMs(displayMs, isStopwatch)}
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

      {/* ── 工具栏：模式 + 控制 + 颜色 + 关闭（小号透明行）── */}
      <div className="flex items-center gap-0.5 mt-2 opacity-40 hover:opacity-90 transition-opacity duration-200">

        {/* 模式切换 */}
        <button
          onClick={() => canSwitchMode && actions.setMode('stopwatch')}
          className={`flex items-center gap-0.5 px-1.5 py-1 rounded text-[10px] font-medium transition-all
            ${isStopwatch ? 'text-white' : 'text-white/50 hover:text-white/80'}
            ${!canSwitchMode ? 'cursor-not-allowed' : ''}`}
          title="正计时"
        >
          <Timer size={9} />秒
        </button>

        <button
          onClick={() => canSwitchMode && actions.setMode('countdown')}
          className={`flex items-center gap-0.5 px-1.5 py-1 rounded text-[10px] font-medium transition-all
            ${!isStopwatch ? 'text-white' : 'text-white/50 hover:text-white/80'}
            ${!canSwitchMode ? 'cursor-not-allowed' : ''}`}
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

        {/* 开始 / 暂停 */}
        <button
          onClick={isRunning ? actions.pause : actions.start}
          disabled={isFinished}
          className={`p-1 transition-colors rounded ${isFinished ? 'text-red-300/50 cursor-not-allowed' : 'text-white/60 hover:text-white'}`}
          title={isRunning ? '暂停' : '开始'}
        >
          {isRunning ? <Pause size={11} /> : <Play size={11} />}
        </button>

        <span className="w-px h-3 bg-white/20 mx-0.5" />

        {/* 颜色 */}
        <button
          onClick={() => colorInputRef.current?.click()}
          className="w-3 h-3 rounded-full border border-white/30 hover:scale-125 transition-transform mx-1"
          style={{ background: customColor ?? 'rgba(255,255,255,0.4)' }}
          title="更改颜色"
        />
        <input ref={colorInputRef} type="color" value={customColor ?? '#ffffff'}
          onChange={e => actions.updateVisual({ customColor: e.target.value })}
          className="sr-only" />

        {/* 关闭 */}
        <button onClick={actions.remove}
          className="p-1 text-white/40 hover:text-white/90 transition-colors rounded"
          title="移除">
          <X size={10} />
        </button>
      </div>

    </div>
  );
};
