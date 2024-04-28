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
   * Whether the loop is paused.
   * This applies immediately and will stop the current loop.
   */
  pause?: boolean,
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

  const [, , paused] = options;

  useEffect(() => {
    if (paused) return;

    const loop = async () => {
      const [callback, delay, paused] = optionsRef.current;
      if (paused) return;

      await callback();
      const nextDelay = getDelay(delay);
      setTimer(setTimeout(loop, nextDelay));
    };

    setTimer(setTimeout(loop, getDelay(optionsRef.current[1])));

    return () => {
      setTimer(timer => {
        if (timer) clearInterval(timer);
        return null;
      });
    };
  }, [paused]);
};
