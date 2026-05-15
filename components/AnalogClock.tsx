import React, { useEffect, useState, useRef } from 'react';
import { ThemeConfig } from '../types';
import { COLOR_PRESETS } from '../constants';
import { useTime } from '../contexts/TimeContext';

interface AnalogClockProps {
  theme: ThemeConfig;
  showSeconds: boolean;
  customColor: string | null;
  customFont: string | null;
  isSmooth?: boolean;
  showHourNumbers?: boolean;
  faceStyle?: string;  // 'classic' | 'minimal' | 'dots' | 'modern' | 'swiss'
}

export const AnalogClock: React.FC<AnalogClockProps> = ({
  theme,
  showSeconds,
  customColor,
  customFont,
  isSmooth = false,
  showHourNumbers = false,
  faceStyle = 'classic',
}) => {
  const time = useTime();
  const [internalAngles, setInternalAngles] = useState({ h: 0, m: 0, s: 0 });
  const rafRef = useRef<number>(0);

  // 非平滑模式：记录历史原始角度和累积角度，确保值只增不减
  const prevRawRef = useRef({ s: -1, m: -1, h: -1 });
  const accumRef  = useRef({ s: 0,  m: 0,  h: 0 });

  /** 将原始角度累计：跨过 360° 时加上一圈而非回零 */
  const accum = (prevRaw: number, currRaw: number, acc: number): number => {
    if (prevRaw < 0) return currRaw; // 首次渲染，直接使用当前值
    let delta = currRaw - prevRaw;
    if (delta < -180) delta += 360; // 正常跨圈：354°→0° 变为 delta=+6°
    return acc + delta;
  };

  useEffect(() => {
    if (isSmooth) {
      // 切换到平滑模式时重置 tick 累积器，避免切回时角度异常
      prevRawRef.current = { s: -1, m: -1, h: -1 };

      const loop = () => {
        const now = new Date();
        const h   = now.getHours();
        const m   = now.getMinutes();
        const s   = now.getSeconds();
        const ms  = now.getMilliseconds();

        // 从当天零点计算总秒数，全天单调递增，完全消除 360° 回绕闪烁
        const totalSec = h * 3600 + m * 60 + s + ms / 1000;

        setInternalAngles({
          s: (totalSec / 60)    * 360,   // 每 60s 转一圈
          m: (totalSec / 3600)  * 360,   // 每 60min 转一圈
          h: (totalSec / 43200) * 360,   // 每 12h 转一圈
        });

        rafRef.current = requestAnimationFrame(loop);
      };

      loop();
      return () => cancelAnimationFrame(rafRef.current);
    } else {
      // Tick 模式：用累积角度确保永远向前，消除 CSS transition 逆时针闪烁
      const rawS = time.seconds * 6;
      const rawM = (time.minutes / 60) * 360 + (time.seconds / 60) * 6;
      const rawH = ((time.hours % 12) / 12) * 360 + (time.minutes / 60) * 30;

      const s = accum(prevRawRef.current.s, rawS, accumRef.current.s);
      const m = accum(prevRawRef.current.m, rawM, accumRef.current.m);
      const h = accum(prevRawRef.current.h, rawH, accumRef.current.h);

      prevRawRef.current = { s: rawS, m: rawM, h: rawH };
      accumRef.current   = { s, m, h };

      setInternalAngles({ s, m, h });
    }
  }, [isSmooth, time]);

  // Destructure for rendering
  const { s: secondDegrees, m: minuteDegrees, h: hourDegrees } = internalAngles;

  const isNeon = theme.id.includes('NEON');
  const fontStyle = customFont ? { fontFamily: customFont } : {};

  // Find active preset if it matches customColor to get SVG stops
  const activePreset = customColor
    ? COLOR_PRESETS.find(p => p.value === customColor)
    : null;

  const isGradient = activePreset?.type === 'gradient';
  const gradientId = 'clock-gradient'; // ID for SVG def

  // Helper to determine stroke color
  const getStrokeColor = (fallbackClass: string) => {
    if (isGradient) return `url(#${gradientId})`;
    if (customColor) return customColor;
    return 'currentColor'; // Will inherit from parent color if set, or rely on class
  };

  // If solid custom color, we set it on the container.
  // If gradient, we set the stroke explicitly to url(#id) and container color is ignored for those elements.
  const containerStyle = {
    ...fontStyle,
    ...(customColor && !isGradient ? { color: customColor } : {})
  };

  // Hour number positions (12, 3, 6, 9)
  const hourNumbers = [
    { num: '12', x: 50, y: 16 },
    { num: '3', x: 86, y: 52 },
    { num: '6', x: 50, y: 88 },
    { num: '9', x: 14, y: 52 },
  ];

  const sc  = getStrokeColor(theme.textClass);
  const acc = getStrokeColor(theme.accentClass);
  const trans = !isSmooth;

  // Arc helper for 'modern' style (progress arc from 12 to current hour)
  const hourFrac = (hourDegrees % 360) / 360;
  const arcR = 42;
  const arcC = 2 * Math.PI * arcR;
  const arcLen = hourFrac * arcC;

  return (
    <div
      className={`relative w-[60vmin] h-[60vmin] max-w-[600px] max-h-[600px] ${!customFont ? theme.fontFamily : ''}`}
      style={containerStyle}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
        <defs>
          {isGradient && activePreset?.svgStops && (
            <linearGradient id={gradientId} x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
              {activePreset.svgStops.map((stop, i) => (
                <stop key={i} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
          )}
        </defs>

        {/* ── FACE ─────────────────────────────────────────────── */}

        {/* classic / dots / swiss: outer ring */}
        {(faceStyle === 'classic' || faceStyle === 'dots' || faceStyle === 'swiss') && (
          <circle cx="50" cy="50" r="48" fill="none" stroke={sc}
            strokeWidth="0.5" opacity={0.25}
            className={!customColor ? theme.textClass : ''} />
        )}

        {/* classic: line markers */}
        {faceStyle === 'classic' && [...Array(12)].map((_, i) => (
          <line key={i} x1="50" y1="6"
            x2="50" y2={showHourNumbers && i % 3 === 0 ? '8' : '12'}
            transform={`rotate(${i * 30} 50 50)`}
            stroke={sc} strokeWidth={i % 3 === 0 ? '1.5' : '0.6'} strokeLinecap="round"
            className={!customColor && !isGradient ? theme.textClass : ''} />
        ))}

        {/* classic: hour numbers */}
        {faceStyle === 'classic' && showHourNumbers && hourNumbers.map(({ num, x, y }) => (
          <text key={num} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            fill={sc} style={{ fontSize: '8px' }}
            className={!customColor && !isGradient ? theme.textClass : ''}>
            {num}
          </text>
        ))}

        {/* dots: circular dot markers */}
        {faceStyle === 'dots' && [...Array(60)].map((_, i) => {
          const isH = i % 5 === 0;
          const r   = isH ? 1.4 : 0.65;
          const d   = 44; // distance from center
          const rad = (i * 6 - 90) * Math.PI / 180;
          return (
            <circle key={i}
              cx={50 + d * Math.cos(rad)} cy={50 + d * Math.sin(rad)} r={r}
              fill={sc} opacity={isH ? 0.85 : 0.35}
              className={!customColor && !isGradient ? theme.textClass : ''} />
          );
        })}

        {/* modern: hour progress arc */}
        {faceStyle === 'modern' && (
          <>
            {/* track */}
            <circle cx="50" cy="50" r={arcR} fill="none" stroke={sc}
              strokeWidth="2.5" opacity={0.12} strokeLinecap="round" />
            {/* progress */}
            <circle cx="50" cy="50" r={arcR} fill="none" stroke={sc}
              strokeWidth="2.5" opacity={0.75} strokeLinecap="round"
              strokeDasharray={arcC} strokeDashoffset={arcC - arcLen}
              transform="rotate(-90 50 50)"
              className={!customColor && !isGradient ? theme.textClass : ''} />
          </>
        )}

        {/* swiss: rectangular markers */}
        {faceStyle === 'swiss' && [...Array(60)].map((_, i) => {
          const isH = i % 5 === 0;
          const w   = isH ? 1.8 : 0.8;
          const h   = isH ? 7   : 3.5;
          const y0  = 3;
          return (
            <rect key={i}
              x={50 - w / 2} y={y0} width={w} height={h}
              fill={sc} opacity={isH ? 0.9 : 0.45}
              transform={`rotate(${i * 6} 50 50)`}
              className={!customColor && !isGradient ? theme.textClass : ''} />
          );
        })}

        {/* ── HANDS ────────────────────────────────────────────── */}

        {/* Hour hand */}
        {faceStyle === 'swiss' ? (
          <rect x="48.2" y="22" width="3.6" height="28" rx="1.8"
            fill={sc} transform={`rotate(${hourDegrees} 50 50)`}
            className={`${!customColor && !isGradient ? theme.textClass : ''} ${trans ? 'transition-transform duration-300 ease-linear' : ''}`} />
        ) : (
          <line x1="50" y1="50" x2="50" y2={faceStyle === 'modern' ? '24' : '25'}
            stroke={sc} strokeWidth={faceStyle === 'modern' ? '3' : '2.5'} strokeLinecap="round"
            transform={`rotate(${hourDegrees} 50 50)`}
            className={`${!customColor && !isGradient ? theme.textClass : ''} ${trans ? 'transition-transform duration-300 ease-linear' : ''}`} />
        )}

        {/* Minute hand */}
        {faceStyle === 'swiss' ? (
          <rect x="48.8" y="12" width="2.4" height="38" rx="1.2"
            fill={sc} transform={`rotate(${minuteDegrees} 50 50)`}
            className={`${!customColor && !isGradient ? theme.textClass : ''} ${trans ? 'transition-transform duration-300 ease-linear' : ''}`} />
        ) : (
          <line x1="50" y1="50" x2="50" y2={faceStyle === 'modern' ? '15' : '15'}
            stroke={sc} strokeWidth={faceStyle === 'modern' ? '2' : '1.5'} strokeLinecap="round"
            transform={`rotate(${minuteDegrees} 50 50)`}
            className={`${!customColor && !isGradient ? theme.textClass : ''} ${trans ? 'transition-transform duration-300 ease-linear' : ''}`} />
        )}

        {/* Second hand */}
        {showSeconds && faceStyle !== 'modern' && (
          faceStyle === 'swiss' ? (
            // Swiss: thin stick + red circle tip
            <g transform={`rotate(${secondDegrees} 50 50)`}
               className={trans ? 'transition-transform duration-75 ease-linear' : ''}>
              <line x1="50" y1="58" x2="50" y2="12" stroke="#ef4444" strokeWidth="0.7" strokeLinecap="round" />
              <circle cx="50" cy="12" r="2.5" fill="#ef4444" />
              <circle cx="50" cy="50" r="2" fill="#ef4444" />
            </g>
          ) : (
            <line x1="50" y1="55" x2="50" y2="10"
              stroke={acc} strokeWidth="0.6" strokeLinecap="round"
              transform={`rotate(${secondDegrees} 50 50)`}
              className={`${!customColor && !isGradient ? theme.accentClass : ''} ${trans ? 'transition-transform duration-75 ease-linear' : ''} ${isNeon ? 'drop-shadow-[0_0_5px_rgba(34,211,238,1)]' : ''}`} />
          )
        )}

        {/* Center dot */}
        <circle cx="50" cy="50" r={faceStyle === 'swiss' ? 2.5 : 1.5}
          fill={faceStyle === 'swiss' ? '#ef4444' : sc} stroke="none"
          className={!customColor && !isGradient && faceStyle !== 'swiss' ? theme.textClass : ''} />
      </svg>
    </div>
  );
};