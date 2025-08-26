import { useMemo } from 'react';
import {
  Measure,
  SettingsLabel,
  Fields,
  SettingsRow,
  SettingsDivider,
  SettingsDescription,
} from '../../common';
import { SettingsInfo } from '../../common/SettingsInfo';
import { useSetting } from '../SettingsProvider';
import { WaSlider } from '@awesome.me/webawesome/dist/react';

export const ClimaxSettings = () => {
  const [climaxChance, setClimaxChance] = useSetting('climaxChance');
  const [ruinChance, setRuinChance] = useSetting('ruinChance');

  const climaxText = useMemo(() => {
    if (climaxChance == 100) {
      return 'You will orgasm';
    }

    if (climaxChance === 0) {
      return "You won't orgasm at all";
    }

    return `${climaxChance}% chance you'll orgasm`;
  }, [climaxChance]);

  const ruinText = useMemo(() => {
    if (ruinChance === 100) {
      return 'You will have a ruined orgasm';
    }

    if (ruinChance === 0) {
      return "You won't have a ruined orgasm";
    }

    return `${ruinChance}% chance you'll have a ruined orgasm`;
  }, [ruinChance]);

  return (
    <Fields label={'Climax'}>
      <SettingsDescription>At the game's climax...</SettingsDescription>
      <SettingsInfo>{climaxText}</SettingsInfo>
      <SettingsRow>
        <SettingsLabel htmlFor='climax-chance'>Orgasm</SettingsLabel>
        <WaSlider
          id='climax-chance'
          value={climaxChance}
          min={0}
          max={100}
          onInput={e => setClimaxChance(e.currentTarget.value)}
          style={{ width: '100%' }}
        />
        <Measure value={climaxChance} chars={3} unit='%' />
      </SettingsRow>
      <SettingsDivider />
      <SettingsDescription>Given an orgasm occurs...</SettingsDescription>
      <SettingsInfo>{ruinText}</SettingsInfo>
      <SettingsRow>
        <SettingsLabel htmlFor='ruin-chance'>Ruin</SettingsLabel>
        <WaSlider
          id='ruin-chance'
          value={ruinChance}
          min={0}
          max={100}
          onInput={e => setRuinChance(e.currentTarget.value)}
          style={{ width: '100%' }}
        />
        <Measure value={ruinChance} chars={3} unit='%' />
      </SettingsRow>
    </Fields>
  );
};
