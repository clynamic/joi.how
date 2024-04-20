import { SettingsDescription } from './SettingsDescription';
import { SettingsLabel } from './SettingsLabel';
import { useMemo, useState } from 'react';
import { SettingsTile } from './SettingsTile';
import { Sparklines, SparklinesLine } from 'react-sparklines';
import { intensityToPaceBounds } from '../../utils';
import { Measure, Divider, Slider } from '../../common';

export const PaceSettings = () => {
  const [minPace, setMinPace] = useState(0.25);
  const [maxPace, setMaxPace] = useState(5);
  const [steepness, setSteepness] = useState(0.05);

  const sparklines = useMemo(() => {
    return Array.from(new Array(20))
      .map((_, index, array) => (index / array.length) * 100)
      .map(intensity =>
        intensityToPaceBounds(intensity, steepness, {
          min: 0,
          max: 10,
        })
      )
      .map(range => range.max - 1.5);
  }, [steepness]);

  return (
    <SettingsTile grid label='Pace'>
      <SettingsDescription>
        Pace settings are mesured in beats per second.
      </SettingsDescription>
      <SettingsLabel>Minimum</SettingsLabel>
      <Slider
        min={0.25}
        max={10}
        step={0.05}
        value={minPace}
        onChange={setMinPace}
      />
      <Measure value={minPace} max={4} unit='b/s' />
      <SettingsLabel>Maximum</SettingsLabel>
      <Slider
        min={0.25}
        max={10}
        step={0.05}
        value={maxPace}
        onChange={setMaxPace}
      />
      <Measure value={maxPace} max={4} unit='b/s' />
      <Divider />
      <SettingsDescription>
        How should the pace change over the course of the game?
      </SettingsDescription>
      <SettingsLabel>Steepness</SettingsLabel>
      <Slider
        min={-0.1}
        max={0.1}
        step={0.005}
        value={steepness}
        onChange={setSteepness}
      />
      <Sparklines
        data={sparklines}
        svgWidth={50}
        svgHeight={20}
        max={11}
        min={-1}
      >
        <SparklinesLine style={{ strokeWidth: 4 }} />
      </Sparklines>
    </SettingsTile>
  );
};
