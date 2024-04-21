import { useMemo, useState } from 'react';
import {
  Divider,
  Measure,
  SettingsLabel,
  SettingsTile,
  SettingsTitle,
  Slider,
} from '../../common';
import { SettingsDescription } from '../../common/SettingsDescription';

export const ClimaxSettings = () => {
  const [climaxChange, setClimaxChange] = useState(100);
  const [ruinChange, setRuinChange] = useState(0);

  const climaxText = useMemo(() => {
    if (climaxChange == 100) {
      return 'You will ejaculate during this game';
    }

    if (climaxChange === 0) {
      return "You won't ejaculate at all during this game";
    }

    return `${climaxChange}% chance you'll ejaculate during this game`;
  }, [climaxChange]);

  const ruinText = useMemo(() => {
    if (ruinChange === 100) {
      return 'You will have a ruined orgasm during this game';
    }

    if (ruinChange === 0) {
      return "You won't have a ruined orgasm during this game";
    }

    return `${ruinChange}% chance you'll have a ruined orgasm during this game`;
  }, [ruinChange]);

  return (
    <SettingsTile grid label={'Climax'}>
      <SettingsTitle>Requires the "cum" event to be enabled</SettingsTitle>
      <SettingsDescription>{climaxText}</SettingsDescription>
      <SettingsLabel>Climax</SettingsLabel>
      <Slider
        value={climaxChange}
        min={0}
        max={100}
        onChange={setClimaxChange}
      />
      <Measure value={climaxChange} max={3} unit='%' />
      <Divider />
      <SettingsTitle>Given an orgasm occurs...</SettingsTitle>
      <SettingsDescription>{ruinText}</SettingsDescription>
      <SettingsLabel>Ruin</SettingsLabel>
      <Slider value={ruinChange} min={0} max={100} onChange={setRuinChange} />
      <Measure value={ruinChange} max={3} unit='%' />
    </SettingsTile>
  );
};
