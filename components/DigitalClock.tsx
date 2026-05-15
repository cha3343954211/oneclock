import React, { useEffect, useState, useRef } from 'react';
import { ThemeConfig } from '../types';
import { useTime } from '../contexts/TimeContext';
import { resolveFontFamily } from '../hooks/widgetPresets';

interface DigitalClockProps {
  theme: ThemeConfig;
  showSeconds: boolean;
  use24Hour: boolean;
  customColor: string | null;
  customFont: string | null;
  compact?: boolean;
  isFlip?: boolean;      // 全局翻页开关（可被 stylePreset 覆盖）
  showDate?: boolean;
  fontPreset?: string;   // per-widget 字体预设
  stylePreset?: string;  // per-widget 展示风格
}

// Define interface for CSS variables to satisfy TypeScript
interface CustomCSSProperties extends React.CSSProperties {
  '--width'?: string | number;
  '--height'?: string | number;
  '--font-size'?: string | number;
}

type FlipAnimStyle = 'flip' | 'slide' | 'fade';

// Sub-component for individual animated digits
const FlipDigit: React.FC<{
  value: string;
  animStyle?: FlipAnimStyle;   // undefined = no animation
  theme: ThemeConfig;
  customColor: string | null;
  customFont: string | null;
  sizeClass: string;
}> = ({ value, animStyle, theme, customColor, customFont, sizeClass }) => {
  const [curr, setCurr] = useState(value);
  const [prev, setPrev] = useState(value);
  const [animating, setAnimating] = useState(false);

  const currRef    = useRef(value);
  const isFirstRun = useRef(true);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ANIM_DURATION = animStyle === 'flip' ? 480 : 320;

  useEffect(() => {
    if (value !== currRef.current) {
      if (animStyle && !isFirstRun.current) {
        const prevVal = currRef.current;
        currRef.current = value;
        setPrev(prevVal);
        setCurr(value);
        setAnimating(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setAnimating(false);
          setPrev(value);
          timerRef.current = null;
        }, ANIM_DURATION);
      } else {
        currRef.current = value;
        setCurr(value);
        setPrev(value);
      }
    }
    isFirstRun.current = false;
    return () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };
  }, [value, animStyle]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Styles & Colors ---

  const isLightTheme = theme.bgClass.includes('stone-100') || theme.bgClass.includes('white');
  const textColor = customColor || (isLightTheme ? '#1a1a2e' : '#f0f0f8');
  const isGradient = textColor.includes('gradient');

  const fontFamily = customFont || (theme.fontFamily.includes('mono') ? 'monospace' : theme.fontFamily.includes('serif') ? 'serif' : 'sans-serif');
  const containerStyle: React.CSSProperties = { fontFamily };

  // tabular-nums keeps digit width stable to prevent layout shift
  const textStyle: React.CSSProperties = {
    color:                !isGradient ? textColor : 'transparent',
    backgroundImage:      isGradient  ? textColor : undefined,
    WebkitBackgroundClip: isGradient  ? 'text'    : undefined,
    backgroundClip:       isGradient  ? 'text'    : undefined,
    fontVariantNumeric:   'tabular-nums',
  };

  // ── 毛玻璃卡片视觉系统 ───────────────────────────────────────────
  const isDark = !isLightTheme;
  // 居中层：毛玻璃背景
  const glassBg = isDark ? 'rgba(18,18,32,0.35)' : 'rgba(255,255,255,0.48)';
  const glassBorder = isDark ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(255,255,255,0.68)';
  const glassShadow = isDark
    ? '0 8px 32px rgba(0,0,0,0.45),0 2px 8px rgba(0,0,0,0.25),inset 0 1px 0 rgba(255,255,255,0.10)'
    : '0 8px 32px rgba(0,0,0,0.10),0 2px 6px rgba(0,0,0,0.06),inset 0 1px 0 rgba(255,255,255,0.95)';
  const glassFilter = 'blur(18px) saturate(180%)';
  // 潜层翻片（不用毛玻璃，避免 3D 动画中 blur 渲染异常）
  const flapTopBg    = isDark ? 'rgba(24,24,40,0.80)' : 'rgba(255,255,255,0.78)';
  const flapBottomBg = isDark ? 'rgba(14,14,26,0.85)' : 'rgba(238,238,252,0.80)';
  // 铰缝
  const hingeGapC   = isDark ? 'rgba(0,0,0,0.40)' : 'rgba(0,0,0,0.10)';
  const hingeShineC = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.80)';
  // 光泽
  const glossBg = isDark
    ? 'linear-gradient(180deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0) 100%)'
    : 'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,rgba(255,255,255,0) 100%)';
  // slide/fade 统一卡片样式
  const cardStyle: React.CSSProperties = {
    background: glassBg, border: glassBorder, boxShadow: glassShadow,
    backdropFilter: glassFilter, WebkitBackdropFilter: glassFilter,
  };

  // --- Slide mode ---
  if (animStyle === 'slide') {
    return (
      <div className={`relative overflow-hidden ${sizeClass} rounded-xl`} style={containerStyle}>
        <div className="absolute inset-0 rounded-xl" style={cardStyle} />
        {animating && (
          <div className="absolute inset-0 flex items-center justify-center z-[2]"
               style={{ animation: 'fd-slide-out 0.32s cubic-bezier(.4,0,.2,1) forwards' }}>
            <span style={{ ...textStyle, fontSize: 'inherit' }} className="font-black leading-none">{prev}</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center z-[3]"
             style={{ animation: animating ? 'fd-slide-in 0.32s cubic-bezier(.4,0,.2,1) forwards' : undefined }}>
          <span style={{ ...textStyle, fontSize: 'inherit' }} className="font-black leading-none">{curr}</span>
        </div>
        <style>{`
          @keyframes fd-slide-out { from{transform:translateY(0);opacity:1} to{transform:translateY(-110%);opacity:0} }
          @keyframes fd-slide-in  { from{transform:translateY(110%);opacity:0} to{transform:translateY(0);opacity:1} }
        `}</style>
      </div>
    );
  }

  // --- Fade mode ---
  if (animStyle === 'fade') {
    return (
      <div className={`relative overflow-hidden ${sizeClass} rounded-xl`} style={containerStyle}>
        <div className="absolute inset-0 rounded-xl" style={cardStyle} />
        {animating && (
          <div className="absolute inset-0 flex items-center justify-center z-[2]"
               style={{ animation: 'fd-fade-out 0.3s ease-out forwards' }}>
            <span style={{ ...textStyle, fontSize: 'inherit' }} className="font-black leading-none">{prev}</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center z-[3]"
             style={{ animation: animating ? 'fd-fade-in 0.3s ease-in forwards' : undefined }}>
          <span style={{ ...textStyle, fontSize: 'inherit' }} className="font-black leading-none">{curr}</span>
        </div>
        <style>{`
          @keyframes fd-fade-out { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(.88)} }
          @keyframes fd-fade-in  { from{opacity:0;transform:scale(1.12)} to{opacity:1;transform:scale(1)} }
        `}</style>
      </div>
    );
  }

  // --- No animation mode (毛玻璃静态卡片) ---
  if (!animStyle) {
    return (
      <div className={`${sizeClass} relative overflow-hidden rounded-xl`}
           style={{ ...containerStyle, background: glassBg, border: glassBorder, boxShadow: glassShadow, backdropFilter: glassFilter, WebkitBackdropFilter: glassFilter }}>
        <div className="absolute left-0 w-full z-[5]" style={{ top: 'calc(50% - 1px)' }}>
          <div className="h-px" style={{ background: hingeGapC }} />
          <div className="h-px" style={{ background: hingeShineC }} />
        </div>
        <div className="absolute top-0 left-0 w-full h-[42%] pointer-events-none z-[6]" style={{ background: glossBg }} />
        <div className="absolute inset-0 flex items-center justify-center z-[7]">
          <span style={{ ...textStyle, fontSize: 'inherit', fontFamily, fontWeight: 900 }} className="leading-none tracking-tighter select-none">
            {value}
          </span>
        </div>
      </div>
    );
  }

  // --- Flip (3D split-flap) mode ---
  const flipTopAnim    = 'fd-flip-top    0.28s cubic-bezier(0.55,0,0.85,0.35) forwards';
  const flipBottomAnim = 'fd-flip-bottom 0.28s 0.15s cubic-bezier(0.15,0.55,0.55,1.0) forwards';
  const sdTopAnim      = 'fd-shadow-top    0.28s cubic-bezier(0.55,0,0.85,0.35) forwards';
  const sdBottomAnim   = 'fd-shadow-bottom 0.28s 0.15s cubic-bezier(0.15,0.55,0.55,1.0) forwards';
  const digitSpan = (val: string) => (
    <span style={{ ...textStyle, fontWeight: 900 }} className="leading-none tracking-tighter select-none">{val}</span>
  );

  return (
    <div className={`${sizeClass} relative`}
         style={{ ...containerStyle, perspective: '600px', perspectiveOrigin: '50% 50%' }}>

      {/* ── 毛玻璃卡片外壳 ── */}
      <div className="absolute inset-0 rounded-xl overflow-hidden"
           style={{ background: glassBg, border: glassBorder, boxShadow: glassShadow, backdropFilter: glassFilter, WebkitBackdropFilter: glassFilter }}>
        <div className="absolute left-0 w-full z-[3]" style={{ top: 'calc(50% - 1px)' }}>
          <div className="h-px" style={{ background: hingeGapC }} />
          <div className="h-px" style={{ background: hingeShineC }} />
        </div>
        <div className="absolute top-0 left-0 w-full h-[42%] pointer-events-none z-[4]" style={{ background: glossBg }} />
      </div>

      {/* ── Static digit ── */}
      <div className="absolute inset-0 flex items-center justify-center z-[2]">{digitSpan(curr)}</div>

      {/* ── Animated flaps ── */}
      {animating && (
        <>
          <div className="absolute top-0 left-0 w-full h-1/2 z-[8] overflow-hidden fd-preserve-3d"
               style={{ background: flapTopBg, borderRadius: '12px 12px 0 0', transformOrigin: 'bottom center', animation: flipTopAnim }}>
            <div className="absolute top-0 w-full h-[200%] flex items-center justify-center">{digitSpan(prev)}</div>
            <div className="absolute top-0 left-0 w-full h-4/5 pointer-events-none" style={{ background: glossBg }} />
            <div className="absolute inset-0" style={{ animation: sdTopAnim }} />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1/2 z-[8] overflow-hidden fd-preserve-3d"
               style={{ background: flapBottomBg, borderRadius: '0 0 12px 12px', transformOrigin: 'top center', transform: 'rotateX(90deg)', animation: flipBottomAnim }}>
            <div className="absolute bottom-0 w-full h-[200%] flex items-center justify-center">{digitSpan(curr)}</div>
            <div className="absolute inset-0" style={{ animation: sdBottomAnim }} />
          </div>
        </>
      )}

      <style>{`
        .fd-preserve-3d{backface-visibility:hidden;-webkit-backface-visibility:hidden;transform-style:preserve-3d}
        @keyframes fd-flip-top{0%{transform:rotateX(0deg)}100%{transform:rotateX(-90deg)}}
        @keyframes fd-flip-bottom{0%{transform:rotateX(90deg)}100%{transform:rotateX(0deg)}}
        @keyframes fd-shadow-top{0%{background:rgba(0,0,0,0)}100%{background:rgba(0,0,0,0.58)}}
        @keyframes fd-shadow-bottom{0%{background:rgba(0,0,0,0.65)}100%{background:rgba(0,0,0,0)}}
      `}</style>
    </div>
  );
};

export const DigitalClock: React.FC<DigitalClockProps> = ({
  theme,
  showSeconds,
  use24Hour,
  customColor,
  customFont,
  compact = false,
  isFlip = false,
  showDate = false,
  fontPreset,
  stylePreset,
}) => {
  const time = useTime();
  const fmt = (n: number) => n.toString().padStart(2, '0');

  const displayHours = use24Hour ? time.hours : (time.hours % 12 || 12);
  const hoursStr   = fmt(displayHours);
  const minutesStr = fmt(time.minutes);
  const secondsStr = fmt(time.seconds);

  // ── 共享样式（传给 FlipDigit / 本地渲染两用）──────────────────────────
  const isLightTheme = theme.bgClass.includes('stone-100') || theme.bgClass.includes('white');
  const effectiveColor = customColor || (isLightTheme ? '#1a1a2e' : '#f0f0f8');
  const isGradient     = effectiveColor.includes('gradient');

  // 字体：fontPreset > customFont > theme
  const themeFontFam = theme.fontFamily.includes('mono') ? 'monospace'
    : theme.fontFamily.includes('serif') ? 'serif' : 'sans-serif';
  const fontFam = resolveFontFamily(fontPreset, customFont || themeFontFam);

  const textStyle: React.CSSProperties = {
    color:                !isGradient ? effectiveColor : 'transparent',
    backgroundImage:      isGradient  ? effectiveColor : undefined,
    WebkitBackgroundClip: isGradient  ? 'text'         : undefined,
    backgroundClip:       isGradient  ? 'text'         : undefined,
    fontVariantNumeric:   'tabular-nums',
    fontFamily:           fontFam,
  };

  // stylePreset 决定展示风格；未设时跟随全局 isFlip
  const displayStyle = stylePreset || (isFlip ? 'flip' : 'text');
  const isAnimMode   = displayStyle === 'flip' || displayStyle === 'slide' || displayStyle === 'fade';
  const animMode     = isAnimMode ? (displayStyle as FlipAnimStyle) : undefined;

  // glow / neon 额外文字阴影
  const glowStyle: React.CSSProperties = !isGradient
    ? displayStyle === 'glow'
      ? { textShadow: `0 0 24px ${effectiveColor}70, 0 0 48px ${effectiveColor}38` }
      : displayStyle === 'neon'
        ? { textShadow: `0 0 8px ${effectiveColor}, 0 0 18px ${effectiveColor}cc, 0 0 36px ${effectiveColor}88, 0 0 72px ${effectiveColor}44` }
        : {}
    : {};

  // ── 尺寸规格 ──────────────────────────────────────────────────────────
  const MAIN = compact
    ? { singleW: 'min(8vw, 88px)',  h: 'min(7.5vw, 82px)',  fs: 'min(7.5vw, 82px)'  }
    : { singleW: 'min(13vw,144px)', h: 'min(11vw,122px)',   fs: 'min(12.5vw,138px)' };
  const SEC  = compact
    ? { singleW: 'min(5vw,  55px)', h: 'min(4.5vw, 50px)',  fs: 'min(4.5vw, 50px)'  }
    : { singleW: 'min(7.5vw,82px)', h: 'min(6.5vw, 72px)',  fs: 'min(7vw,   77px)'  };

  /** 纯文字，无卡片无边框（text / glow / neon 共用） */
  const renderPair = (valStr: string, sz: typeof MAIN) => (
    <span
      className="font-black leading-none tracking-tight select-none"
      style={{ ...textStyle, ...glowStyle, fontSize: sz.fs }}
    >
      {valStr}
    </span>
  );

  /** 翻页/滑动/渐隐：每位独立卡片（动画必须） */
  const renderAnimPair = (valStr: string, sz: typeof MAIN) => (
    <div className="flex gap-[5px]">
      {[valStr[0], valStr[1]].map((digit, i) => (
        <div key={i} style={{ width: sz.singleW, height: sz.h, fontSize: sz.h }}>
          <FlipDigit
            value={digit}
            animStyle={animMode}
            theme={theme}
            customColor={customColor}
            customFont={customFont}
            sizeClass="w-full h-full"
          />
        </div>
      ))}
    </div>
  );

  const renderGroup = (valStr: string, sz: typeof MAIN) =>
    isAnimMode ? renderAnimPair(valStr, sz) : renderPair(valStr, sz);

  /** 分隔符：翻牌模式用两圆点，普通模式用冒号 */
  const dotColor = isGradient ? (isLightTheme ? '#1a1a2e' : '#f0f0f8') : effectiveColor;
  const Sep = ({ opacity = 0.7, sz = MAIN }: { opacity?: number; sz?: typeof MAIN }) => {
    if (isAnimMode) {
      const ds = `clamp(5px,min(1.3vw,14px),14px)`;
      return (
        <div className="flex flex-col items-center justify-center"
             style={{ height: sz.h, gap: 'clamp(4px,min(0.9vw,10px),10px)' }}>
          <div style={{ width: ds, height: ds, borderRadius: '50%', background: dotColor, opacity }} />
          <div style={{ width: ds, height: ds, borderRadius: '50%', background: dotColor, opacity }} />
        </div>
      );
    }
    return (
      <span className="font-black leading-none select-none animate-pulse"
            style={{ ...textStyle, ...glowStyle, fontSize: sz.fs, opacity, lineHeight: 1 }}>:
      </span>
    );
  };

  return (
    <div className="flex flex-col items-center select-none">
      <div className="flex items-center gap-[clamp(4px,0.6vw,10px)]">

        {renderGroup(hoursStr, MAIN)}
        <Sep />
        {renderGroup(minutesStr, MAIN)}

        {showSeconds && (
          <>
            <Sep opacity={0.45} sz={SEC} />
            {renderGroup(secondsStr, SEC)}
          </>
        )}
      </div>

      {showDate && (
        <div
          className={`mt-5 tracking-[0.18em] uppercase font-medium opacity-60 ${theme.textClass}`}
          style={{
            color:      customColor && !isGradient ? customColor : undefined,
            fontSize:   compact ? '0.75rem' : '1.1rem',
            fontFamily: fontFam,
          }}
        >
          {time.fullDate}
          {!use24Hour && (
            <span className="ml-2 px-2 py-0.5 bg-white/10 rounded text-xs align-middle">{time.period}</span>
          )}
        </div>
      )}
    </div>
  );
};
