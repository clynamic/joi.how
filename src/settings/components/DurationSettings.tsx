import {
  Measure,
  SettingsDescription,
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
      <SettingsDescription>
        Warmup period allows you to view images, without the game starting.
      </SettingsDescription>
      <SettingsLabel>Warmup duration</SettingsLabel>
      <Slider
        min='0'
        max='300'
        step='60'
        value={warmupDuration}
        onChange={setWarmupDuration}
      />
      <Measure value={Math.ceil(warmupDuration / 60)} chars={2} unit='min' />
      <SettingsDescription>
        Session duration is a rough estimate. The game will not forcefully end.
      </SettingsDescription>
      <SettingsLabel>Session duration</SettingsLabel>
      <Slider
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
