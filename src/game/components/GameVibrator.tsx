import { useEffect, useState } from 'react';
import { useAutoRef, useVibratorValue, VibrationMode, wait } from '../../utils';
import { useSetting } from '../../settings';
import { useGameState } from '../hooks';
import { GamePhase, PhaseState } from '../plugins/phase';
import { StrokeDirection, StrokeState } from '../plugins/stroke';
import { PaceState } from '../plugins/pace';
import { IntensityState } from '../plugins/intensity';

export const GameVibrator = () => {
  const { stroke } = useGameState<StrokeState>(['core.stroke']) ?? {};
  const { intensity } = useGameState<IntensityState>(['core.intensity']) ?? {};
  const { pace } = useGameState<PaceState>(['core.pace']) ?? {};
  const { current: phase } = useGameState<PhaseState>(['core.phase']) ?? {};
  const [mode] = useSetting('vibrations');
  const [devices] = useVibratorValue('devices');

  const data = useAutoRef({
    intensity: (intensity ?? 0) * 100,
    pace: pace ?? 1,
    devices,
    mode,
  });

  const [currentPhase, setCurrentPhase] = useState(phase);

  useEffect(() => {
    const { intensity, pace, devices, mode } = data.current;
    switch (stroke) {
      case StrokeDirection.up:
        switch (mode) {
          case VibrationMode.constant: {
            const strength = intensity / 100;
            devices.forEach(device => device.setVibration(strength));
            break;
          }
          case VibrationMode.thump: {
            const length = (1 / pace) * 1000;
            const strength = Math.max(0.25, intensity / 100);
            devices.forEach(device => device.thump(length, strength));
            break;
          }
        }
        break;
      case StrokeDirection.down:
        break;
    }
  }, [data, stroke]);

  useEffect(() => {
    const { devices, mode } = data.current;
    if (currentPhase == phase) return;
    if (phase === GamePhase.break) {
      devices.forEach(device => device.setVibration(0));
    }
    if (phase === GamePhase.climax) {
      (async () => {
        for (let i = 0; i < 15; i++) {
          const strength = Math.max(0, 1 - i * 0.067);
          switch (mode) {
            case VibrationMode.constant:
              devices.forEach(device => device.setVibration(strength));
              break;
            case VibrationMode.thump:
              devices.forEach(device => device.thump(400, strength));
              break;
          }
          await wait(400);
        }
      })();
    }
    setCurrentPhase(phase);
  }, [data, currentPhase, phase]);

  return null;
};
