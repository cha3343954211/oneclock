import React from 'react';
import { ThemeConfig } from '../types';
import { useTime } from '../contexts/TimeContext';

interface DateLineProps {
    theme: ThemeConfig;
    use24Hour: boolean;
    customColor: string | null;
    customFont: string | null;
    layoutStyle?: string;  // 'text' | 'badge' | 'card' | 'expanded'
}

export const DateLine: React.FC<DateLineProps> = ({
    theme,
    use24Hour,
    customColor,
    customFont,
    layoutStyle = 'text',
}) => {
    const time = useTime();
    const isGradient = customColor?.includes('gradient');
    const color = customColor && !isGradient ? customColor : undefined;

    const textStyle: React.CSSProperties = {
        color,
        fontFamily:           customFont || undefined,
        backgroundImage:      isGradient ? customColor || undefined : undefined,
        WebkitBackgroundClip: isGradient ? 'text' : undefined,
        backgroundClip:       isGradient ? 'text' : undefined,
        WebkitTextFillColor:  isGradient ? 'transparent' : undefined,
        userSelect:           'none',
        pointerEvents:        'none',
    };

    const cls = `${!customColor ? theme.textClass : ''} ${!customFont ? theme.fontFamily : ''}`;

    // 从 fullDate 拆分（通常格式如 "WEDNESDAY, 15 JANUARY 2025"）
    const parts = time.fullDate.split(/,\s*/);
    const dayName  = parts[0] ?? '';                      // "WEDNESDAY"
    const restParts = (parts[1] ?? '').trim().split(' '); // ["15", "JANUARY", "2025"]
    const dayNum   = restParts[0] ?? '';
    const monthStr = restParts[1] ?? '';
    const yearStr  = restParts[2] ?? '';

    // ── text (default) ──────────────────────────────────────────────────
    if (layoutStyle === 'text') {
        return (
            <div className={`tracking-[0.2em] uppercase font-medium opacity-80 ${cls}`}
                style={{ ...textStyle, fontSize: 'clamp(0.8rem, 2vw, 1.4rem)' }}>
                {time.fullDate}
                {!use24Hour && (
                    <span className="ml-2 px-2 py-1 bg-white/10 rounded text-xs align-middle">
                        {time.period}
                    </span>
                )}
            </div>
        );
    }

    // ── badge ────────────────────────────────────────────────────────────
    if (layoutStyle === 'badge') {
        const glassStyle: React.CSSProperties = {
            background:     'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
            border:         `1px solid ${color ? color + '40' : 'rgba(255,255,255,0.15)'}`,
            boxShadow:      '0 4px 20px rgba(0,0,0,0.25)',
        };
        return (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full select-none" style={glassStyle}>
                <span className={`text-xs tracking-[0.18em] uppercase font-semibold ${cls}`}
                    style={{ ...textStyle, pointerEvents: 'none' }}>
                    {dayName}
                </span>
                <span className="w-[1px] h-3 bg-white/20 flex-shrink-0" />
                <span className={`text-xs tracking-[0.12em] font-medium ${cls}`}
                    style={{ ...textStyle, pointerEvents: 'none' }}>
                    {dayNum} {monthStr}
                </span>
                {!use24Hour && (
                    <span className="ml-1 px-1.5 py-0.5 bg-white/10 rounded text-[10px] align-middle">
                        {time.period}
                    </span>
                )}
            </div>
        );
    }

    // ── card ─────────────────────────────────────────────────────────────
    if (layoutStyle === 'card') {
        const cardStyle: React.CSSProperties = {
            background:     'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(14px)',
            border:         `1px solid ${color ? color + '30' : 'rgba(255,255,255,0.10)'}`,
            boxShadow:      '0 8px 32px rgba(0,0,0,0.30)',
        };
        return (
            <div className="flex flex-col items-center select-none rounded-2xl px-8 py-4 min-w-[180px]"
                style={cardStyle}>
                <div className={`text-[10px] tracking-[0.25em] uppercase opacity-55 ${cls}`}
                    style={{ ...textStyle, pointerEvents: 'none' }}>
                    {dayName}
                </div>
                <div className={`font-black leading-none mt-1 ${cls}`}
                    style={{ ...textStyle, fontSize: 'clamp(3rem, 8vw, 6rem)', pointerEvents: 'none' }}>
                    {dayNum}
                </div>
                <div className={`text-sm tracking-widest uppercase mt-1 opacity-70 ${cls}`}
                    style={{ ...textStyle, pointerEvents: 'none' }}>
                    {monthStr} {yearStr}
                </div>
                {!use24Hour && (
                    <div className="mt-2 px-2 py-0.5 bg-white/10 rounded text-xs text-white/70">
                        {time.period}
                    </div>
                )}
            </div>
        );
    }

    // ── expanded ─────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col items-center gap-1 select-none" style={{ pointerEvents: 'none' }}>
            <div className={`text-sm font-semibold tracking-[0.2em] uppercase opacity-55 ${cls}`}
                style={{ ...textStyle }}>
                {dayName}
            </div>
            <div className={`font-medium tracking-[0.1em] ${cls}`}
                style={{ ...textStyle, fontSize: 'clamp(1rem, 2.5vw, 1.8rem)' }}>
                {dayNum} {monthStr}{yearStr ? `, ${yearStr}` : ''}
                {!use24Hour && (
                    <span className="ml-2 px-2 py-0.5 bg-white/10 rounded text-sm align-middle">
                        {time.period}
                    </span>
                )}
            </div>
        </div>
    );
};
