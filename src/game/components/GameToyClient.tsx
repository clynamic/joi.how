import { useEffect, useState } from 'react';
import { GamePhase, useGameValue } from '../GameProvider';
import { useAutoRef } from '../../utils';
import { useToyClientValue } from '../../toy';

export const GameToyClient = () => {
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
    devices.forEach(device => {
      device.actuate(stroke, intensity, pace);
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
        devices.forEach(device => device.climax());
    }
    setCurrentPhase(phase);
  }, [data, currentPhase, phase]);

  return null;
};
