import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { TimeState } from '../types';

/**
 * TimeContext - 全局共享时间状态
 *
 * 设计目标：
 * 1. 每秒只在 TimeProvider 内部触发一次重渲染
 * 2. 订阅者（useTime）只在自己组件树重渲染，不会污染 App 根
 * 3. 配合 React.memo 可彻底切断不需要时间的子树
 */

const initialTime: TimeState = {
  hours: 0,
  minutes: 0,
  seconds: 0,
  period: 'AM',
  fullDate: '',
};

const TimeContext = createContext<TimeState>(initialTime);

interface TimeProviderProps {
  children: React.ReactNode;
  /** 更新间隔（ms），默认 1000 */
  interval?: number;
}

export const TimeProvider: React.FC<TimeProviderProps> = ({ children, interval = 1000 }) => {
  const [time, setTime] = useState<TimeState>(() => buildTimeState(new Date()));

  const tick = useCallback(() => {
    setTime(buildTimeState(new Date()));
  }, []);

  useEffect(() => {
    let timerId: number;

    /**
     * 自校正调度：每次计算距下一秒边界的剩余毫秒数再 setTimeout，
     * 彻底消除 setInterval 的累积漂移。
     */
    const schedule = () => {
      const delay = interval - (Date.now() % interval);
      timerId = window.setTimeout(() => {
        tick();
        schedule();
      }, delay);
    };

    // 立即同步一次，再启动自校正链
    tick();
    schedule();

    /** 标签页从后台恢复时立即补一次 tick 并重新对齐 */
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        tick();
        window.clearTimeout(timerId);
        schedule();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [tick, interval]);

  return <TimeContext.Provider value={time}>{children}</TimeContext.Provider>;
};

/** 订阅当前时间状态 */
export const useTime = (): TimeState => useContext(TimeContext);

// ---------- helpers ----------

function buildTimeState(now: Date): TimeState {
  return {
    hours: now.getHours(),
    minutes: now.getMinutes(),
    seconds: now.getSeconds(),
    period: now.getHours() >= 12 ? 'PM' : 'AM',
    fullDate: now.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };
}
