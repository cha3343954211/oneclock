import React from 'react';
import { ThemeConfig } from '../types';
import { useTime } from '../contexts/TimeContext';

interface DateLineProps {
    theme: ThemeConfig;
    use24Hour: boolean;
    customColor: string | null;
    customFont: string | null;
}

export const DateLine: React.FC<DateLineProps> = ({
    theme,
    use24Hour,
    customColor,
    customFont
}) => {
    const time = useTime();
    const isGradient = customColor?.includes('gradient');

    const textStyle: React.CSSProperties = {
        color: customColor && !isGradient ? customColor : undefined,
        fontFamily: customFont || undefined,
        backgroundImage: isGradient ? customColor : undefined,
        WebkitBackgroundClip: isGradient ? 'text' : undefined,
        backgroundClip: isGradient ? 'text' : undefined,
        WebkitTextFillColor: isGradient ? 'transparent' : undefined,
    };

    return (
        <div
            className={`tracking-[0.2em] uppercase font-medium opacity-80 ${!customColor ? theme.textClass : ''} ${!customFont ? theme.fontFamily : ''}`}
            style={{
                ...textStyle,
                fontSize: 'clamp(0.8rem, 2vw, 1.4rem)',
                pointerEvents: 'none',
                userSelect: 'none',
            }}
        >
            {time.fullDate}
            {!use24Hour && (
                <span className="ml-2 px-2 py-1 bg-white/10 rounded text-xs align-middle">
                    {time.period}
                </span>
            )}
        </div>
    );
};
