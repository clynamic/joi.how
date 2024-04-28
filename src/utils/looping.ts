import { useEffect, useRef, useState } from 'react';

export type LoopingOptions = [
  /**
   * The callback to run on each loop.
   */
  callback: () => void | Promise<void>,
  /**
   * The delay in milliseconds or a function that returns the delay in milliseconds.
   * Is re-evaluated on each loop. Does not effect the current loop.
   */
  delay: number | (() => number),
  /**
   * Whether the loop is enabled or not.
   * This applies immediately and will stop the current loop.
   */
  enabled?: boolean,
];

const getDelay = (delay: number | (() => number)) => {
  return typeof delay === 'function' ? delay() : delay;
};

export const useLooping = (...options: LoopingOptions) => {
  const [, setTimer] = useState<number | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const [, , enabled = true] = options;

  useEffect(() => {
    if (!enabled) return;

    const loop = async () => {
      const [callback, delay, enabled = true] = optionsRef.current;
      if (!enabled) return;

      await callback();
      const nextDelay = getDelay(delay);
      if (nextDelay <= 0) return;
      setTimer(setTimeout(loop, nextDelay));
    };

    const delay = getDelay(optionsRef.current[1]);
    if (delay <= 0) return;

    setTimer(setTimeout(loop, delay));

    return () => {
      setTimer(timer => {
        if (timer) clearInterval(timer);
        return null;
      });
    };
  }, [enabled]);
};
