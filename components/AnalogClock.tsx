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
}

export const AnalogClock: React.FC<AnalogClockProps> = ({
  theme,
  showSeconds,
  customColor,
  customFont,
  isSmooth = false,
  showHourNumbers = false
}) => {
  const time = useTime();
  // We use internal state for smooth animations to bypass the 1-second tick from App.tsx
  const [internalAngles, setInternalAngles] = useState({ h: 0, m: 0, s: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (isSmooth) {
      const loop = () => {
        const now = new Date();
        const ms = now.getMilliseconds();
        const s = now.getSeconds();
        const m = now.getMinutes();
        const h = now.getHours();

        // Continuous degrees
        const totalSeconds = s + ms / 1000;
        const totalMinutes = m + totalSeconds / 60;
        const totalHours = (h % 12) + totalMinutes / 60;

        setInternalAngles({
          s: totalSeconds * 6,
          m: totalMinutes * 6,
          h: totalHours * 30
        });

        rafRef.current = requestAnimationFrame(loop);
      };

      loop();
      return () => cancelAnimationFrame(rafRef.current);
    } else {
      // Fallback to integer props if not smooth
      // Calculate degrees based on standard props
      const secondDegrees = ((time.seconds / 60) * 360);
      const minuteDegrees = ((time.minutes / 60) * 360) + ((time.seconds / 60) * 6);
      const hourDegrees = ((time.hours / 12) * 360) + ((time.minutes / 60) * 30);

      setInternalAngles({
        s: secondDegrees,
        m: minuteDegrees,
        h: hourDegrees
      });
    }
  }, [isSmooth, time]); // If not smooth, update when time prop changes

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

  return (
    <div
      className={`relative w-[60vmin] h-[60vmin] max-w-[600px] max-h-[600px] ${!customFont ? theme.fontFamily : ''}`}
      style={containerStyle}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
        <defs>
          {isGradient && activePreset?.svgStops && (
            <linearGradient
              id={gradientId}
              x1="0" y1="0" x2="100" y2="0"
              gradientUnits="userSpaceOnUse"
            >
              {activePreset.svgStops.map((stop, i) => (
                <stop key={i} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
          )}
        </defs>

        {/* Clock Face Background */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke={getStrokeColor(theme.textClass)}
          strokeWidth="0.5"
          className={`${!customColor ? theme.textClass : ''} opacity-20`}
        />

        {/* Hour Markers */}
        {[...Array(12)].map((_, i) => (
          <line
            key={i}
            x1="50"
            y1="6"
            x2="50"
            y2={showHourNumbers && i % 3 === 0 ? "8" : "12"}
            transform={`rotate(${i * 30} 50 50)`}
            stroke={getStrokeColor(theme.textClass)}
            strokeWidth={i % 3 === 0 ? "1.5" : "0.5"}
            strokeLinecap="round"
            className={`${(!customColor && !isGradient) ? theme.textClass : ''}`}
          />
        ))}

        {/* Hour Numbers (12, 3, 6, 9) */}
        {showHourNumbers && hourNumbers.map(({ num, x, y }) => (
          <text
            key={num}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={getStrokeColor(theme.textClass)}
            className={`${(!customColor && !isGradient) ? theme.textClass : ''} text-[8px] font-medium`}
            style={{ fontSize: '8px' }}
          >
            {num}
          </text>
        ))}

        {/* Hour Hand */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="25"
          stroke={getStrokeColor(theme.textClass)}
          strokeWidth="2.5"
          strokeLinecap="round"
          transform={`rotate(${hourDegrees} 50 50)`}
          // Remove transition when smooth to avoid lag, keep it for tick mode
          className={`${(!customColor && !isGradient) ? theme.textClass : ''} ${!isSmooth ? 'transition-transform duration-300 ease-linear' : ''}`}
        />

        {/* Minute Hand */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="15"
          stroke={getStrokeColor(theme.textClass)}
          strokeWidth="1.5"
          strokeLinecap="round"
          transform={`rotate(${minuteDegrees} 50 50)`}
          className={`${(!customColor && !isGradient) ? theme.textClass : ''} ${!isSmooth ? 'transition-transform duration-300 ease-linear' : ''}`}
        />

        {/* Second Hand */}
        {showSeconds && (
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="10"
            stroke={getStrokeColor(theme.accentClass)}
            strokeWidth="0.5"
            strokeLinecap="round"
            transform={`rotate(${secondDegrees} 50 50)`}
            className={`${(!customColor && !isGradient) ? theme.accentClass : ''} ${!isSmooth ? 'transition-transform duration-75 ease-linear' : ''} ${isNeon ? 'drop-shadow-[0_0_5px_rgba(34,211,238,1)]' : ''}`}
          />
        )}

        {/* Center Dot */}
        <circle
          cx="50"
          cy="50"
          r="1.5"
          className={(!customColor && !isGradient) ? theme.textClass : ''}
          fill={getStrokeColor(theme.textClass)}
          stroke="none"
        />
      </svg>
    </div>
  );
};