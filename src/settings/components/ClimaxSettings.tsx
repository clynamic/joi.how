import { useMemo } from 'react';
import {
  Divider,
  Measure,
  SettingsLabel,
  SettingsTile,
  SettingsTitle,
  Slider,
} from '../../common';
import { SettingsDescription } from '../../common/SettingsDescription';
import { useSetting } from '../SettingsProvider';

export const ClimaxSettings = () => {
  const [climaxChance, setClimaxChance] = useSetting('climaxChance');
  const [ruinChance, setRuinChance] = useSetting('ruinChance');

  const climaxText = useMemo(() => {
    if (climaxChance == 100) {
      return 'You will ejaculate during this game';
    }

    if (climaxChance === 0) {
      return "You won't ejaculate at all during this game";
    }

    return `${climaxChance}% chance you'll ejaculate during this game`;
  }, [climaxChance]);

  const ruinText = useMemo(() => {
    if (ruinChance === 100) {
      return 'You will have a ruined orgasm during this game';
    }

    if (ruinChance === 0) {
      return "You won't have a ruined orgasm during this game";
    }

    return `${ruinChance}% chance you'll have a ruined orgasm during this game`;
  }, [ruinChance]);

  return (
    <SettingsTile grid label={'Climax'}>
      <SettingsTitle>Requires the "cum" event to be enabled</SettingsTitle>
      <SettingsDescription>{climaxText}</SettingsDescription>
      <SettingsLabel htmlFor='climax-chance'>Climax</SettingsLabel>
      <Slider
        id='climax-chance'
        value={climaxChance}
        min={0}
        max={100}
        onChange={setClimaxChance}
      />
      <Measure value={climaxChance} chars={3} unit='%' />
      <Divider />
      <SettingsTitle>Given an orgasm occurs...</SettingsTitle>
      <SettingsDescription>{ruinText}</SettingsDescription>
      <SettingsLabel htmlFor='ruin-chance'>Ruin</SettingsLabel>
      <Slider
        id='ruin-chance'
        value={ruinChance}
        min={0}
        max={100}
        onChange={setRuinChance}
      />
      <Measure value={ruinChance} chars={3} unit='%' />
    </SettingsTile>
  );
};
