import { SettingsTile } from './SettingsTile';
import { useState } from 'react';
import { SettingsDescription } from './SettingsDescription';
import { SettingsLabel } from './SettingsLabel';
import { Measure, Slider } from '../../common';

export const DurationSetting = () => {
  const [duration, setDuration] = useState(9000);
  const [warmupDuration, setWarmupDuration] = useState(0);

  return (
    <SettingsTile grid label='Duration'>
      <SettingsDescription>
        Warmup period allows you to view images, without the game starting.
      </SettingsDescription>
      <SettingsLabel>Warmup duration</SettingsLabel>
      <Slider
        min='0'
        max='6000'
        step='600'
        value={warmupDuration}
        onChange={setWarmupDuration}
      />
      <Measure value={Math.ceil(warmupDuration / 10 / 60)} max={2} unit='min' />
      <SettingsDescription>
        Session duration is a rough estimate. The game will not forcefully end.
      </SettingsDescription>
      <SettingsLabel>Session duration</SettingsLabel>
      <Slider
        min='1800'
        max='18000'
        step='600'
        value={duration}
        onChange={setDuration}
      />
      <Measure value={Math.ceil(duration / 10 / 60)} max={2} unit='min' />
    </SettingsTile>
  );
};
