import { useMemo } from 'react';
import { ResponsiveContainer, XAxis, YAxis, AreaChart, Area } from 'recharts';
import { paceGraphPoint } from '../../utils';
import {
  Measure,
  Divider,
  Slider,
  SettingsInfo,
  SettingsLabel,
  SettingsTile,
  Space,
  SettingsDescription,
} from '../../common';
import { useSetting } from '../SettingsProvider';

const settingsMinPace = 0.25;
const settingsMaxPace = 10;

export const PaceSettings = () => {
  const [minPace, setMinPace] = useSetting('minPace');
  const [maxPace, setMaxPace] = useSetting('maxPace');
  const [steepness, setSteepness] = useSetting('steepness');
  const [timeshift, setTimeshift] = useSetting('timeshift');

  const chartData = useMemo(() => {
    return Array.from(new Array(100))
      .map((_, index) => index / 100)
      .map(t =>
        paceGraphPoint(t, steepness, timeshift, {
          min: settingsMinPace,
          max: settingsMaxPace,
        })
      );
  }, [steepness, timeshift]);

  return (
    <SettingsTile grid label='Pace'>
      <SettingsDescription>Choose beat speed</SettingsDescription>
      <SettingsInfo>The game will run in beats per second (b/s)</SettingsInfo>
      <SettingsLabel htmlFor='minPace'>Minimum</SettingsLabel>
      <Slider
        id='minPace'
        min={settingsMinPace}
        max={settingsMaxPace}
        step={0.05}
        value={minPace}
        onChange={setMinPace}
      />
      <Measure value={minPace} chars={4} unit='b/s' />
      <SettingsLabel htmlFor='maxPace'>Maximum</SettingsLabel>
      <Slider
        id='maxPace'
        min={settingsMinPace}
        max={settingsMaxPace}
        step={0.05}
        value={maxPace}
        onChange={setMaxPace}
      />
      <Measure value={maxPace} chars={4} unit='b/s' />
      <Divider />
      <SettingsInfo>
        The random pace event will pick a pace from this curve
      </SettingsInfo>
      <SettingsLabel htmlFor='steepness'>Steepness</SettingsLabel>
      <Slider
        id='steepness'
        min={0}
        max={1}
        step={0.05}
        value={steepness}
        onChange={setSteepness}
      />
      <Measure value={steepness * 100} chars={2} unit='%' />
      <SettingsLabel htmlFor='timeshift'>Timeshift</SettingsLabel>
      <Slider
        id='timeshift'
        min={0}
        max={1}
        step={0.05}
        value={timeshift}
        onChange={setTimeshift}
      />
      <Measure value={timeshift * 100} chars={2} unit='%' />
      <Space size='medium' />
      <div />
      <div
        style={{
          height: '100px',
        }}
      >
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart data={chartData.map(([x, y]) => ({ x, y }))}>
            <XAxis type='number' dataKey='x' hide />
            <YAxis type='number' dataKey='y' hide />
            <Area
              animationDuration={0}
              type='monotone'
              dataKey='y'
              stroke='var(--primary)'
              fill='var(--section-color)'
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div />
    </SettingsTile>
  );
};
