import React, { useEffect, useState, useRef } from 'react';
import { ThemeConfig } from '../types';
import { useTime } from '../contexts/TimeContext';

interface DigitalClockProps {
  theme: ThemeConfig;
  showSeconds: boolean;
  use24Hour: boolean;
  customColor: string | null;
  customFont: string | null;
  compact?: boolean;
  isFlip?: boolean;
  showDate?: boolean;
}

// Define interface for CSS variables to satisfy TypeScript
interface CustomCSSProperties extends React.CSSProperties {
  '--width'?: string | number;
  '--height'?: string | number;
  '--font-size'?: string | number;
}

// Sub-component for individual realistic flipping digits
const FlipDigit: React.FC<{
  value: string;
  isFlip: boolean;
  theme: ThemeConfig;
  customColor: string | null;
  customFont: string | null;
  sizeClass: string;
}> = ({ value, isFlip, theme, customColor, customFont, sizeClass }) => {
  const [curr, setCurr] = useState(value);
  const [prev, setPrev] = useState(value);
  const [animating, setAnimating] = useState(false);

  // Use a ref to prevent animation on initial mount
  const isFirstRun = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value !== curr) {
      if (isFlip && !isFirstRun.current) {
        setPrev(curr);
        setCurr(value);
        setAnimating(true);

        if (timerRef.current) clearTimeout(timerRef.current);

        // Animation duration is 600ms (0.6s)
        timerRef.current = setTimeout(() => {
          setAnimating(false);
          setPrev(value);
        }, 600);
      } else {
        // Instant update if not flip mode or first run
        setCurr(value);
        setPrev(value);
      }
    }
    isFirstRun.current = false;

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, isFlip, curr]);

  // --- Styles & Colors ---

  const isLightTheme = theme.bgClass.includes('stone-100') || theme.bgClass.includes('white');
  const cardBg = isLightTheme ? 'bg-[#e0e0e0]' : 'bg-[#2a2a2a]';
  const textColor = customColor || (isLightTheme ? '#333' : '#eee');
  const isGradient = textColor.includes('gradient');

  // Container styling
  const fontFamily = customFont || (theme.fontFamily.includes('mono') ? 'monospace' : theme.fontFamily.includes('serif') ? 'serif' : 'sans-serif');
  const containerStyle: React.CSSProperties = { fontFamily };

  // Text styling
  const textStyle: React.CSSProperties = {
    color: !isGradient ? textColor : 'transparent',
    backgroundImage: isGradient ? textColor : undefined,
    WebkitBackgroundClip: isGradient ? 'text' : undefined,
    backgroundClip: isGradient ? 'text' : undefined,
  };

  // --- Standard Mode (Non-Flip) ---
  if (!isFlip) {
    return (
      <div
        className={`flex flex-col items-center justify-center ${sizeClass}`}
        style={containerStyle}
      >
        <span
          style={{ ...textStyle, fontSize: 'inherit', fontFamily }}
          className="font-bold leading-none"
        >
          {value}
        </span>
      </div>
    );
  }

  // --- Flip Mode Structure ---
  return (
    <div className={`flip-clock-container ${sizeClass} relative z-0`} style={containerStyle}>

      <div className={`flip-card relative w-full h-full rounded-lg shadow-xl overflow-hidden ${cardBg}`}>

        {/* 1. BOTTOM STATIC (Shows Current - Waiting to be revealed fully) */}
        <div className="absolute top-0 w-full h-full z-[1]">
          <div className="absolute top-0 w-full h-[50%] overflow-hidden bg-inherit border-b border-black/10">
            {/* Top half placeholder */}
            <div className="absolute top-0 w-full h-[200%] flex justify-center items-center">
              <span style={textStyle} className="font-bold">{curr}</span>
            </div>
          </div>
          <div className="absolute bottom-0 w-full h-[50%] overflow-hidden bg-inherit">
            <div className="absolute bottom-0 w-full h-[200%] flex justify-center items-center">
              <span style={textStyle} className="font-bold">{curr}</span>
            </div>
          </div>
        </div>

        {/* 2. TOP STATIC (Shows Next/Current underneath the flap) - Visual Fallback */}
        {/* Actually, in a 2-flap system, the bottom static layer handles the 'Next' value visually 
              once the top flap falls. We just need to make sure the TOP placeholder is correct. */}

        {/* 3. ANIMATING FLAPS */}
        {animating && (
          <>
            {/* TOP FLAP (Shows Previous Value) - Falls Down */}
            <div
              className={`absolute top-0 w-full h-[50%] overflow-hidden z-[10] origin-bottom backface-hidden rounded-t-lg ${cardBg}`}
              style={{
                animation: 'flip-down-top 0.6s ease-in forwards',
                borderBottom: '1px solid rgba(0,0,0,0.1)'
              }}
            >
              <div className="absolute top-0 w-full h-[200%] flex justify-center items-center">
                <span style={textStyle} className="font-bold">{prev}</span>
              </div>
              {/* Shadow when falling */}
              <div className="absolute inset-0 animate-shadow-down"></div>
            </div>

            {/* BOTTOM FLAP (Shows Current Value) - Reveals Up (visually creates the landing effect) */}
            <div
              className={`absolute bottom-0 w-full h-[50%] overflow-hidden z-[10] origin-top backface-hidden rounded-b-lg ${cardBg}`}
              style={{
                animation: 'flip-down-bottom 0.6s ease-out forwards',
                transform: 'rotateX(90deg)', // Start hidden
                borderTop: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <div className="absolute bottom-0 w-full h-[200%] flex justify-center items-center">
                <span style={textStyle} className="font-bold">{curr}</span>
              </div>
              {/* Highlight/Shadow when revealing */}
              <div className="absolute inset-0 animate-shadow-up"></div>
            </div>
          </>
        )}

        {/* If NOT animating, we need to show the stable state (which is essentially 'curr' everywhere) */}
        {!animating && (
          <div className="absolute top-0 w-full h-[50%] overflow-hidden z-[5] border-b border-black/10">
            <div className="absolute top-0 w-full h-[200%] flex justify-center items-center">
              <span style={textStyle} className="font-bold">{curr}</span>
            </div>
          </div>
        )}

        {/* Center Seam / Hinge */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] mt-[-1px] bg-black/20 z-[20] shadow-[0_1px_1px_rgba(255,255,255,0.1)]" />
      </div>

      <style>{`
         .backface-hidden {
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
            transform-style: preserve-3d;
         }
         
         @keyframes flip-down-top {
            0% { transform: rotateX(0deg); }
            100% { transform: rotateX(-90deg); }
         }
         
         @keyframes flip-down-bottom {
            0% { transform: rotateX(90deg); }
            100% { transform: rotateX(0deg); }
         }
         
         @keyframes shadow-down {
            0% { background-color: rgba(0,0,0,0); }
            100% { background-color: rgba(0,0,0,0.4); }
         }
         
         @keyframes shadow-up {
            0% { background-color: rgba(0,0,0,0.4); }
            100% { background-color: rgba(0,0,0,0); }
         }

         /* Animation Utilities */
         .animate-shadow-down {
            animation: shadow-down 0.6s ease-in forwards;
         }
         .animate-shadow-up {
            animation: shadow-up 0.6s ease-out forwards;
         }
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
  showDate = false
}) => {
  const time = useTime();
  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const displayHours = use24Hour
    ? time.hours
    : (time.hours % 12 || 12);

  const hoursStr = formatNumber(displayHours);
  const minutesStr = formatNumber(time.minutes);
  const secondsStr = formatNumber(time.seconds);

  // Responsive CSS Variables
  // Using min() ensures it looks good on mobile but doesn't explode on 4k screens
  const standardVars: CustomCSSProperties = {
    '--width': 'min(14vw, 160px)',
    '--height': 'min(20vw, 240px)',
    '--font-size': 'min(15vw, 170px)',
  };

  const standardSecVars: CustomCSSProperties = {
    '--width': 'min(8vw, 100px)',
    '--height': 'min(12vw, 140px)',
    '--font-size': 'min(8vw, 85px)',
  };

  const compactVars: CustomCSSProperties = {
    '--width': '8vw',
    '--height': '11vw',
    '--font-size': '8vw'
  };

  // Helper to render a group of digits
  const renderDigitGroup = (valStr: string, vars: CustomCSSProperties) => {
    const wrapperStyle = {
      width: vars['--width'],
      height: vars['--height'],
      fontSize: vars['--font-size'],
    } as React.CSSProperties;

    return (
      <div className="flex gap-1 md:gap-3">
        <div style={wrapperStyle}>
          <FlipDigit
            value={valStr[0]}
            isFlip={isFlip}
            theme={theme}
            customColor={customColor}
            customFont={customFont}
            sizeClass="w-full h-full"
          />
        </div>
        <div style={wrapperStyle}>
          <FlipDigit
            value={valStr[1]}
            isFlip={isFlip}
            theme={theme}
            customColor={customColor}
            customFont={customFont}
            sizeClass="w-full h-full"
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col items-center select-none`}>
      <div className="flex items-end gap-2 md:gap-4">

        {/* Hours */}
        {renderDigitGroup(hoursStr, compact ? compactVars : standardVars)}

        {/* Separator */}
        <div
          className={`flex items-center justify-center pb-[2vw] ${compact ? 'h-[10vw]' : 'h-[18vw]'} font-bold ${theme.accentClass}`}
          style={{
            fontSize: compact ? '5vw' : '8vw',
            color: customColor || undefined,
            opacity: 0.8
          }}
        >
          <span className={!isFlip ? 'animate-pulse' : ''}>:</span>
        </div>

        {/* Minutes */}
        {renderDigitGroup(minutesStr, compact ? compactVars : standardVars)}

        {/* Seconds */}
        {showSeconds && (
          <>
            <div
              className={`flex items-end justify-center pb-[1vw] ${compact ? 'h-[10vw]' : 'h-[18vw]'} font-bold ${theme.accentClass}`}
              style={{
                fontSize: compact ? '3vw' : '5vw',
                color: customColor || undefined,
                opacity: 0.6
              }}
            >
              :
            </div>
            {renderDigitGroup(secondsStr, compact ? { ...compactVars, '--width': '5vw', '--height': '7vw', '--font-size': '5vw' } : standardSecVars)}
          </>
        )}
      </div>

      {/* Date / AM/PM - only shown if showDate is true */}
      {showDate && (
        <div
          className={`mt-6 md:mt-10 tracking-[0.2em] uppercase font-medium opacity-60 ${theme.textClass}`}
          style={{
            color: customColor && !customColor.includes('gradient') ? customColor : undefined,
            fontSize: compact ? '0.8rem' : '1.2rem'
          }}
        >
          {time.fullDate} {!use24Hour && <span className="ml-2 px-2 py-1 bg-white/10 rounded text-xs align-middle">{time.period}</span>}
        </div>
      )}
    </div>
  );
};
