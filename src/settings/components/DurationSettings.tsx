import {
  Divider,
  Measure,
  SettingsDescription,
  SettingsInfo,
  SettingsLabel,
  SettingsTile,
  Slider,
} from '../../common';
import { useSetting } from '../SettingsProvider';

export const DurationSettings = () => {
  const [warmupDuration, setWarmupDuration] = useSetting('warmupDuration');
  const [gameDuration, setGameDuration] = useSetting('gameDuration');

  return (
    <SettingsTile grid label='Duration'>
      <SettingsDescription>Determine game length</SettingsDescription>
      <SettingsInfo>Warmup period has no beats</SettingsInfo>
      <SettingsLabel htmlFor='warmupDuration'>Warmup duration</SettingsLabel>
      <Slider
        id='warmupDuration'
        min='0'
        max='300'
        step='60'
        value={warmupDuration}
        onChange={setWarmupDuration}
      />
      <Measure value={Math.ceil(warmupDuration / 60)} chars={2} unit='min' />
      <Divider />
      <SettingsInfo>
        A climax event will trigger roughly after this time
      </SettingsInfo>
      <SettingsLabel htmlFor='gameDuration'>Session duration</SettingsLabel>
      <Slider
        id='gameDuration'
        min='180'
        max='1800'
        step='60'
        value={gameDuration}
        onChange={setGameDuration}
      />
      <Measure value={Math.ceil(gameDuration / 60)} chars={2} unit='min' />
    </SettingsTile>
  );
};
