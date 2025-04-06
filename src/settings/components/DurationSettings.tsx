import { Slider } from '@mui/material';
import {
  Measure,
  SettingsDescription,
  SettingsInfo,
  SettingsLabel,
  Fields,
  SettingsDivider,
  SettingsRow,
} from '../../common';
import { useSetting } from '../SettingsProvider';

export const DurationSettings = () => {
  const [warmupDuration, setWarmupDuration] = useSetting('warmupDuration');
  const [gameDuration, setGameDuration] = useSetting('gameDuration');

  return (
    <Fields label='Duration'>
      <SettingsDescription>Determine game length</SettingsDescription>
      <SettingsInfo>Warmup period has no beats</SettingsInfo>
      <SettingsRow>
        <SettingsLabel htmlFor='warmupDuration'>Warmup duration</SettingsLabel>
        <Slider
          id='warmupDuration'
          min={0}
          max={300}
          step={60}
          value={warmupDuration}
          onChange={(_, value) => setWarmupDuration(value as number)}
        />
        <Measure value={Math.ceil(warmupDuration / 60)} chars={2} unit='min' />
      </SettingsRow>
      <SettingsDivider />
      <SettingsInfo>
        A climax event will trigger roughly after this time
      </SettingsInfo>
      <SettingsRow>
        <SettingsLabel htmlFor='gameDuration'>Session duration</SettingsLabel>
        <Slider
          id='gameDuration'
          min={180}
          max={3600}
          step={60}
          value={gameDuration}
          onChange={(_, value) => setGameDuration(value as number)}
        />
        <Measure value={Math.ceil(gameDuration / 60)} chars={2} unit='min' />
      </SettingsRow>
    </Fields>
  );
};
