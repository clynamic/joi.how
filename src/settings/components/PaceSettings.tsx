import { useMemo } from 'react';
import { ResponsiveContainer, XAxis, YAxis, AreaChart, Area } from 'recharts';
import { paceGraphPoint } from '../../utils';
import {
  Measure,
  SettingsInfo,
  SettingsLabel,
  Fields,
  Space,
  SettingsDescription,
  SettingsRow,
  SettingsDivider,
} from '../../common';
import { useSetting } from '../SettingsProvider';
import { Slider } from '@mui/material';

export const PaceSettings = () => {
  const settingsMinPace = 0.25;
  const settingsMaxPace = 6;

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
    <Fields label='Pace'>
      <SettingsDescription>Choose beat speed</SettingsDescription>
      <SettingsInfo>The game will run in beats per second (b/s)</SettingsInfo>
      <SettingsRow>
        <SettingsLabel htmlFor='minPace'>Minimum</SettingsLabel>
        <Slider
          id='minPace'
          min={settingsMinPace}
          max={settingsMaxPace}
          step={0.1}
          value={minPace}
          onChange={(_, value) => setMinPace(value as number)}
        />
        <Measure value={minPace} chars={3} unit='b/s' />
      </SettingsRow>
      <SettingsRow>
        <SettingsLabel htmlFor='maxPace'>Maximum</SettingsLabel>
        <Slider
          id='maxPace'
          min={settingsMinPace}
          max={settingsMaxPace}
          step={0.1}
          value={maxPace}
          onChange={(_, value) => setMaxPace(value as number)}
        />
        <Measure value={maxPace} chars={3} unit='b/s' />
      </SettingsRow>
      <SettingsDivider />
      <SettingsInfo>
        The random pace event will pick a pace from this curve
      </SettingsInfo>
      <SettingsRow>
        <SettingsLabel htmlFor='steepness'>Steepness</SettingsLabel>
        <Slider
          id='steepness'
          min={0}
          max={1}
          step={0.05}
          value={steepness}
          onChange={(_, value) => setSteepness(value as number)}
        />
        <Measure value={Math.floor(steepness * 100)} chars={3} unit='%' />
      </SettingsRow>
      <SettingsRow>
        <SettingsLabel htmlFor='timeshift'>Timeshift</SettingsLabel>
        <Slider
          id='timeshift'
          min={0}
          max={1}
          step={0.05}
          value={timeshift}
          onChange={(_, value) => setTimeshift(value as number)}
        />
        <Measure value={Math.floor(timeshift * 100)} chars={3} unit='%' />
      </SettingsRow>
      <Space size='medium' />
      <SettingsRow>
        <SettingsLabel style={{ alignSelf: 'flex-end' }}>start</SettingsLabel>
        <div
          style={{
            height: '100px',
            width: '100%',
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
                fill='var(--primary)'
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <SettingsLabel
          style={{
            width: '100%',
            textAlign: 'end',
            alignSelf: 'flex-start',
          }}
        >
          end
        </SettingsLabel>
      </SettingsRow>
    </Fields>
  );
};
