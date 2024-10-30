import { useEffect, useState } from 'react';
import { GamePhase, useGameValue } from '../GameProvider';
import { useAutoRef, useToyClientValue, wait } from '../../utils';
import { ActuatorType } from 'buttplug';

export const GameVibrator = () => {
  const [stroke] = useGameValue('stroke');
  const [intensity] = useGameValue('intensity');
  const [pace] = useGameValue('pace');
  const [phase] = useGameValue('phase');
  const [devices] = useToyClientValue('devices');

  const data = useAutoRef({
    intensity,
    pace,
    devices,
  });

  const [currentPhase, setCurrentPhase] = useState(phase);

  useEffect(() => {
    const { intensity, pace, devices } = data.current;
    devices.forEach(device =>
      device.actuators.forEach(() => console.log('actuator activated'))
    );
    devices.forEach(device => {
      const vibrationArray: number[] = [];
      device.actuators.forEach(actuator => {
        switch (actuator.actuatorType) {
          case ActuatorType.Vibrate:
            console.log(`Actual intensity: ${intensity}`);
            vibrationArray[actuator.index] = actuator.getOutput?.(
              stroke,
              intensity,
              pace
            ) as number;
            break;
          default:
            break;
        }
      });
      if (vibrationArray.length > 0) {
        device.setVibration(vibrationArray);
      }
    });
  }, [data, stroke]);

  useEffect(() => {
    const { devices } = data.current;
    if (currentPhase == phase) return;
    switch (phase) {
      case GamePhase.pause:
      case GamePhase.break:
        devices.forEach(device => device.stop());
        break;
      case GamePhase.climax:
        (async () => {
          for (let i = 0; i < 15; i++) {
            const strength = Math.max(0, 1 - i * 0.067);
            devices.forEach(device => device.setVibration(strength));
            await wait(400);
          }
        })();
    }
    setCurrentPhase(phase);
  }, [data, currentPhase, phase]);

  return null;
};
