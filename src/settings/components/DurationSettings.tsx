import {
  Measure,
  SettingsDescription,
  SettingsInfo,
  SettingsLabel,
  Fields,
  SettingsRow,
  SettingsDivider,
} from '../../common';
import { useSetting } from '../SettingsProvider';
import { WaSlider } from '@awesome.me/webawesome/dist/react';

export const DurationSettings = () => {
  const [warmupDuration, setWarmupDuration] = useSetting('warmupDuration');
  const [gameDuration, setGameDuration] = useSetting('gameDuration');

  return (
    <Fields label='Duration'>
      <SettingsDescription>Determine game length</SettingsDescription>
      <SettingsInfo>Warmup period has no beats</SettingsInfo>
      <SettingsRow>
        <SettingsLabel htmlFor='warmupDuration'>Warmup duration</SettingsLabel>
        <WaSlider
          id='warmupDuration'
          min={0}
          max={300}
          step={60}
          value={warmupDuration}
          onInput={e =>
            setWarmupDuration(parseFloat(e.currentTarget.value.toString()))
          }
          style={{ width: '100%' }}
        />
        <Measure value={Math.ceil(warmupDuration / 60)} chars={2} unit='min' />
      </SettingsRow>
      <SettingsDivider />
      <SettingsInfo>
        A climax event will trigger roughly after this time
      </SettingsInfo>
      <SettingsRow>
        <SettingsLabel htmlFor='gameDuration'>Session duration</SettingsLabel>
        <WaSlider
          id='gameDuration'
          min={180}
          max={1800}
          step={60}
          value={gameDuration}
          onInput={e =>
            setGameDuration(parseFloat(e.currentTarget.value.toString()))
          }
          style={{ width: '100%' }}
        />
        <Measure value={Math.ceil(gameDuration / 60)} chars={2} unit='min' />
      </SettingsRow>
    </Fields>
  );
};
