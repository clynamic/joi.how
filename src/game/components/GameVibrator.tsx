import { useEffect, useState } from 'react';
import { GamePhase, Stroke, useGameValue } from '../GameProvider';
import { useAutoRef, useVibratorValue, VibrationMode, wait } from '../../utils';
import { useSetting } from '../../settings';

export const GameVibrator = () => {
  const [stroke] = useGameValue('stroke');
  const [intensity] = useGameValue('intensity');
  const [pace] = useGameValue('pace');
  const [phase] = useGameValue('phase');
  const [mode] = useSetting('vibrations');
  const [devices] = useVibratorValue('devices');

  const data = useAutoRef({
    intensity,
    pace,
    devices,
    mode,
  });

  const [currentPhase, setCurrentPhase] = useState(phase);

  useEffect(() => {
    const { intensity, pace, devices, mode } = data.current;
    devices.forEach(device =>
      device.actuators.forEach(() => console.log('actuator activated'))
    );
    switch (stroke) {
      case Stroke.up:
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
      case Stroke.down:
        break;
    }
  }, [data, stroke]);

  useEffect(() => {
    const { devices, mode } = data.current;
    if (currentPhase == phase) return;
    if ([GamePhase.break, GamePhase.pause].includes(phase)) {
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
