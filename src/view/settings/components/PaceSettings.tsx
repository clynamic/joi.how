import { useMemo } from 'react';
import { ResponsiveContainer, XAxis, YAxis, AreaChart, Area } from 'recharts';
import { paceGraphPoint } from '../../../game/classic/pace';
import {
  Measure,
  SettingsInfo,
  SettingsLabel,
  Fields,
  SettingsRow,
  SettingsDivider,
  Space,
  SettingsDescription,
} from '../../common';
import { useKeys } from '../../bridge/hooks';
import Pace from '../../../game/classic/pace';
import { WaSlider } from '@awesome.me/webawesome/dist/react';

const settingsMinPace = 0.25;
const settingsMaxPace = 10;

export const PaceSettings = () => {
  const [{ minPace, maxPace, steepness, timeshift }, set] = useKeys(Pace.keys);

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
        <WaSlider
          id='minPace'
          min={settingsMinPace}
          max={settingsMaxPace}
          step={0.05}
          value={minPace}
          onInput={e =>
            set('minPace', parseFloat(e.currentTarget.value.toString()))
          }
          style={{ width: '100%' }}
        />
        <Measure value={minPace} chars={4} unit='b/s' />
      </SettingsRow>
      <SettingsRow>
        <SettingsLabel htmlFor='maxPace'>Maximum</SettingsLabel>
        <WaSlider
          id='maxPace'
          min={settingsMinPace}
          max={settingsMaxPace}
          step={0.05}
          value={maxPace}
          onInput={e =>
            set('maxPace', parseFloat(e.currentTarget.value.toString()))
          }
          style={{ width: '100%' }}
        />
        <Measure value={maxPace} chars={4} unit='b/s' />
      </SettingsRow>
      <SettingsDivider />
      <SettingsInfo>
        The random pace event will pick a pace from this curve
      </SettingsInfo>
      <SettingsRow>
        <SettingsLabel htmlFor='steepness'>Steepness</SettingsLabel>
        <WaSlider
          id='steepness'
          min={0}
          max={1}
          step={0.05}
          value={steepness}
          onInput={e =>
            set('steepness', parseFloat(e.currentTarget.value.toString()))
          }
          style={{ width: '100%' }}
        />
        <Measure value={Math.floor(steepness * 100)} chars={3} unit='%' />
      </SettingsRow>
      <SettingsRow>
        <SettingsLabel htmlFor='timeshift'>Timeshift</SettingsLabel>
        <WaSlider
          id='timeshift'
          min={0}
          max={1}
          step={0.05}
          value={timeshift}
          onInput={e =>
            set('timeshift', parseFloat(e.currentTarget.value.toString()))
          }
          style={{ width: '100%' }}
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
            textAlign: 'right',
            alignSelf: 'flex-start',
          }}
        >
          end
        </SettingsLabel>
      </SettingsRow>
    </Fields>
  );
};
