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
    <div style={{ minWidth: 230 }}>
      <div className="bg-black/75 backdrop-blur-xl border border-white/15 rounded-2xl shadow-[0_8px_36px_rgba(0,0,0,0.55)] flex flex-col gap-3 px-4 py-3.5">

        {/* ── 顶栏：名称 + 颜色点 + 关闭 ── */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/40 font-medium tracking-wide">{name}</span>
          <div className="flex items-center gap-1.5">
            {/* 快捷颜色按钮 */}
            <button
              onClick={() => colorInputRef.current?.click()}
              className="w-4 h-4 rounded-full border border-white/30 hover:scale-125 transition-transform"
              style={{ background: customColor ?? 'rgba(255,255,255,0.3)' }}
              title="更改颜色"
            />
            <input
              ref={colorInputRef}
              type="color"
              value={customColor ?? '#ffffff'}
              onChange={e => actions.updateVisual({ customColor: e.target.value })}
              className="sr-only"
            />
            {/* 关闭 */}
            <button onClick={actions.remove}
              className="p-0.5 text-white/30 hover:text-white/80 hover:bg-white/10 rounded transition-all"
              title="移除计时器">
              <X size={13} />
            </button>
          </div>
        </div>

        {/* ── 模式标签 ── */}
        <div className="flex bg-white/5 rounded-xl p-1 gap-1">
          <button
            onClick={() => canSwitchMode && actions.setMode('stopwatch')}
            className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium transition-all
              ${isStopwatch ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'}
              ${!canSwitchMode ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <Timer size={11} />正计时
          </button>
          <button
            onClick={() => canSwitchMode && actions.setMode('countdown')}
            className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium transition-all
              ${!isStopwatch ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'}
              ${!canSwitchMode ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <AlarmClock size={11} />倒计时
          </button>
        </div>

        {/* ── 倒计时目标输入（仅 idle 时） ── */}
        {!isStopwatch && status === 'idle' && (
          <CountdownInput targetMs={countdownTarget} onChange={ms => actions.setCountdownTarget(ms)} />
        )}

        {/* ── 主时间显示 ── */}
        <div
          className={`font-mono font-bold text-center tracking-tight ${timeColorClass}`}
          style={{ fontSize: 'clamp(2rem, 6.5vw, 3.6rem)', letterSpacing: '-0.02em', lineHeight: 1, ...timeColorStyle }}
        >
          {isFinished ? '完成!' : formatMs(displayMs, isStopwatch)}
        </div>

        {/* ── 倒计时进度条 ── */}
        {!isStopwatch && !isFinished && countdownTarget > 0 && (
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${Math.max(0, (displayMs / countdownTarget) * 100)}%`,
                background: customColor
                  ? `linear-gradient(90deg, ${customColor}88, ${customColor})`
                  : 'linear-gradient(90deg, #34d399, #60a5fa)',
              }}
            />
          </div>
        )}

        {/* ── 控制按钮 ── */}
        <div className="flex items-center justify-center gap-3">
          <button onClick={actions.reset}
            className="p-2 rounded-xl text-white/35 hover:text-white hover:bg-white/10 transition-all"
            title="重置">
            <RotateCcw size={15} />
          </button>

          <button
            onClick={isRunning ? actions.pause : actions.start}
            disabled={isFinished}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-medium text-sm transition-all
              ${isFinished
                ? 'bg-red-500/15 text-red-300/60 cursor-not-allowed'
                : isRunning
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-white/20 text-white hover:bg-white/30 shadow-md'}`}
          >
            {isRunning ? <><Pause size={15} />暂停</> : isFinished ? <span className="text-xs">已完成</span> : <><Play size={15} />开始</>}
          </button>
        </div>

        {/* ── 完成提示 ── */}
        {isFinished && !isStopwatch && (
          <p className="text-center text-[10px] text-red-300/60 animate-pulse">↑ 按重置重新设置</p>
        )}

        {/* ── 双击提示 ── */}
        <p className="text-center text-[9px] text-white/15 -mt-1">双击调整大小 · 旋转 · 透明度</p>
      </div>
    </div>
  );
};
