import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ElementConfig } from '../types';

interface DraggableElementProps {
    id: string;
    config: ElementConfig;
    onConfigChange: (id: string, config: Partial<ElementConfig>) => void;
    onDoubleClick: (id: string) => void;
    children: React.ReactNode;
    containerRef: React.RefObject<HTMLDivElement>;
    dragSensitivity?: number;
}

export const DraggableElement: React.FC<DraggableElementProps> = ({
    id,
    config,
    onConfigChange,
    onDoubleClick,
    children,
    containerRef,
    dragSensitivity = 1.0
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isPinching, setIsPinching] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const elementStartPos = useRef({ x: 0, y: 0 });
    const initialPinchDistance = useRef(0);
    const initialPinchAngle = useRef(0);
    const initialScale = useRef(1);
    const initialRotation = useRef(0);

    // Stable refs for wheel handler — avoids stale closure in high-frequency events
    const elementRef = useRef<HTMLDivElement>(null);
    const scaleRef = useRef(config.scale);
    const cbRef   = useRef(onConfigChange);
    useEffect(() => { scaleRef.current = config.scale; }, [config.scale]);
    useEffect(() => { cbRef.current   = onConfigChange; }, [onConfigChange]);

    // Calculate distance between two touch points
    const getTouchDistance = (touches: TouchList) => {
        if (touches.length < 2) return 0;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // Calculate angle between two touch points
    const getTouchAngle = (touches: TouchList) => {
        if (touches.length < 2) return 0;
        const dx = touches[1].clientX - touches[0].clientX;
        const dy = touches[1].clientY - touches[0].clientY;
        return Math.atan2(dy, dx) * (180 / Math.PI);
    };

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.detail >= 2) return; // Allow double-click to pass through

        e.preventDefault();
        e.stopPropagation();

        setIsDragging(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        elementStartPos.current = { x: config.x, y: config.y };
    }, [config.x, config.y]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const container = containerRef.current;
        const rect = container.getBoundingClientRect();

        // Calculate delta as percentage of container size (using width for both to maintain aspect)
        const deltaX = ((e.clientX - dragStartPos.current.x) / rect.width) * 200 * dragSensitivity;
        const deltaY = ((e.clientY - dragStartPos.current.y) / rect.height) * 200 * dragSensitivity;

        // No limits - allow any position
        const newX = elementStartPos.current.x + deltaX;
        const newY = elementStartPos.current.y + deltaY;

        onConfigChange(id, { x: newX, y: newY });
    }, [isDragging, id, onConfigChange, containerRef]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.touches.length === 2) {
            // Start pinch zoom + rotate
            setIsPinching(true);
            setIsDragging(false);
            initialPinchDistance.current = getTouchDistance(e.touches);
            initialPinchAngle.current = getTouchAngle(e.touches);
            initialScale.current = config.scale;
            initialRotation.current = config.rotation || 0;
        } else if (e.touches.length === 1) {
            // Start drag
            const touch = e.touches[0];
            dragStartPos.current = { x: touch.clientX, y: touch.clientY };
            elementStartPos.current = { x: config.x, y: config.y };
            setIsDragging(true);
            setIsPinching(false);
        }
    }, [config.x, config.y, config.scale, config.rotation]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!containerRef.current) return;

        if (isPinching && e.touches.length === 2) {
            // Handle pinch zoom + rotate
            e.preventDefault();
            e.stopPropagation();

            const currentDistance = getTouchDistance(e.touches);
            const currentAngle = getTouchAngle(e.touches);

            if (initialPinchDistance.current > 0) {
                // Calculate new scale
                const scaleRatio = currentDistance / initialPinchDistance.current;
                const newScale = Math.max(0.05, Math.min(50, initialScale.current * scaleRatio));

                // Calculate new rotation
                let angleDelta = currentAngle - initialPinchAngle.current;
                // Normalize angle delta
                if (angleDelta > 180) angleDelta -= 360;
                if (angleDelta < -180) angleDelta += 360;
                const newRotation = initialRotation.current + angleDelta;

                onConfigChange(id, { scale: newScale, rotation: newRotation });
            }
        } else if (isDragging && e.touches.length === 1) {
            // Handle drag
            e.preventDefault();
            e.stopPropagation();

            const touch = e.touches[0];
            const container = containerRef.current;
            const rect = container.getBoundingClientRect();

            // Calculate delta as percentage of container size
            const deltaX = ((touch.clientX - dragStartPos.current.x) / rect.width) * 200 * dragSensitivity;
            const deltaY = ((touch.clientY - dragStartPos.current.y) / rect.height) * 200 * dragSensitivity;

            // No limits - allow any position
            const newX = elementStartPos.current.x + deltaX;
            const newY = elementStartPos.current.y + deltaY;

            onConfigChange(id, { x: newX, y: newY });
        }
    }, [isPinching, isDragging, id, onConfigChange, containerRef]);

    const handleTouchEnd = useCallback((e: TouchEvent) => {
        if (e.touches.length === 0) {
            setIsDragging(false);
            setIsPinching(false);
        } else if (e.touches.length === 1 && isPinching) {
            // Transition from pinch to drag
            setIsPinching(false);
            const touch = e.touches[0];
            dragStartPos.current = { x: touch.clientX, y: touch.clientY };
            elementStartPos.current = { x: config.x, y: config.y };
            setIsDragging(true);
        }
    }, [isPinching, config.x, config.y]);

    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDoubleClick(id);
    }, [id, onDoubleClick]);

    // ── 滚轮无极缩放（非 passive，直接操作 ref 避免闭包过期）──
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // 统一为像素单位
        let delta = e.deltaY;
        if (e.deltaMode === 1) delta *= 16;   // lines
        if (e.deltaMode === 2) delta *= 400;  // pages
        // 指数平滑：每 100px ≈ ×0.905 / ÷0.905
        const factor   = Math.pow(0.999, delta);
        const newScale = Math.max(0.05, Math.min(50, scaleRef.current * factor));
        scaleRef.current = newScale; // 立即更新，避免快速滚动时值滞后
        cbRef.current(id, { scale: newScale });
    }, [id]);

    useEffect(() => {
        const el = elementRef.current;
        if (!el) return;
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    // Add global event listeners for drag and pinch
    React.useEffect(() => {
        if (isDragging || isPinching) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging, isPinching, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

    if (!config.visible) return null;

    const rotation = config.rotation || 0;
    const opacity = config.opacity ?? 1;

    return (
        <div
            ref={elementRef}
            className={`absolute ${(isDragging || isPinching) ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
                left: `calc(50% + ${config.x}vw)`,
                top: `calc(50% + ${config.y}vh)`,
                transform: `translate(-50%, -50%) scale(${config.scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                userSelect: 'none',
                touchAction: 'none',
                zIndex: (isDragging || isPinching) ? 100 : (config.zIndex || 10),
                opacity: opacity,
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onDoubleClick={handleDoubleClick}
        >
            {children}
        </div>
    );
};
