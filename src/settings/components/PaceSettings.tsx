import { useMemo } from 'react';
import { Sparklines, SparklinesLine } from 'react-sparklines';
import { intensityToPace } from '../../utils';
import {
  Measure,
  Divider,
  Slider,
  SettingsDescription,
  SettingsLabel,
  SettingsTile,
} from '../../common';
import { useSetting } from '../SettingsProvider';

const settingsMinPace = 0.25;
const settingsMaxPace = 10;

export const PaceSettings = () => {
  const [minPace, setMinPace] = useSetting('minPace');
  const [maxPace, setMaxPace] = useSetting('maxPace');
  const [steepness, setSteepness] = useSetting('steepness');

  const sparklines = useMemo(() => {
    return Array.from(new Array(20))
      .map((_, index, array) => (index / array.length) * 100)
      .map(intensity =>
        intensityToPace(intensity, steepness, {
          min: settingsMinPace,
          max: settingsMaxPace,
        })
      );
  }, [steepness]);

  return (
    <SettingsTile grid label='Pace'>
      <SettingsDescription>
        Pace settings are mesured in beats per second.
      </SettingsDescription>
      <SettingsLabel>Minimum</SettingsLabel>
      <Slider
        min={settingsMinPace}
        max={settingsMaxPace}
        step={0.05}
        value={minPace}
        onChange={setMinPace}
      />
      <Measure value={minPace} chars={4} unit='b/s' />
      <SettingsLabel>Maximum</SettingsLabel>
      <Slider
        min={settingsMinPace}
        max={settingsMaxPace}
        step={0.05}
        value={maxPace}
        onChange={setMaxPace}
      />
      <Measure value={maxPace} chars={4} unit='b/s' />
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
        max={settingsMaxPace + 1}
        min={settingsMinPace - 1}
      >
        <SparklinesLine style={{ strokeWidth: 4 }} />
      </Sparklines>
    </SettingsTile>
  );
};
