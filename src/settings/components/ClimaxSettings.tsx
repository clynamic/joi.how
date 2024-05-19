import { useMemo } from 'react';
import {
  Divider,
  Measure,
  SettingsLabel,
  SettingsTile,
  SettingsDescription,
  Slider,
} from '../../common';
import { SettingsInfo } from '../../common/SettingsInfo';
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
      <SettingsDescription>When a climax event triggers</SettingsDescription>
      <SettingsInfo>{climaxText}</SettingsInfo>
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
      <SettingsDescription>Given an orgasm occurs...</SettingsDescription>
      <SettingsInfo>{ruinText}</SettingsInfo>
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
