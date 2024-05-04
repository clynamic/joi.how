import {
  SettingsTile,
  SettingsTitle,
  ToggleTile,
  ToggleTileType,
} from '../../common';
import {
  GameHypnoType,
  GameHypnoDescriptions,
  GameHypnoLabels,
} from '../../types';
import { useSetting } from '../SettingsProvider';

export const HypnoSettings = () => {
  const [hypno, setHypno] = useSetting('hypno');

  return (
    <SettingsTile label={'Hypno'} role='radiogroup'>
      <SettingsTitle>Select a hypno text set</SettingsTitle>
      {Object.keys(GameHypnoType).map(key => {
        const current = GameHypnoType[key as keyof typeof GameHypnoType];
        return (
          <ToggleTile
            key={current}
            enabled={hypno === current}
            onClick={() => setHypno(current)}
            type={ToggleTileType.radio}
          >
            <strong>{GameHypnoLabels[current]}</strong>
            <p>{GameHypnoDescriptions[current]}</p>
          </ToggleTile>
        );
      })}
    </SettingsTile>
  );
};
