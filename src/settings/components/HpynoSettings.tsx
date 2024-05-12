import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
import {
  faCat,
  faCow,
  faDog,
  faOtter,
  faPowerOff,
} from '@fortawesome/free-solid-svg-icons';

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
            value={hypno === current}
            onClick={() => setHypno(current)}
            type={ToggleTileType.radio}
            trailing={(() => {
              switch (current) {
                case GameHypnoType.off:
                  return <FontAwesomeIcon icon={faPowerOff} />;
                case GameHypnoType.joi:
                  return <FontAwesomeIcon icon={faOtter} />;
                case GameHypnoType.breeding:
                  return <FontAwesomeIcon icon={faCow} />;
                case GameHypnoType.maledom:
                  return <FontAwesomeIcon icon={faDog} />;
                case GameHypnoType.femdom:
                  return <FontAwesomeIcon icon={faCat} />;
              }
            })()}
          >
            <strong>{GameHypnoLabels[current]}</strong>
            <p>{GameHypnoDescriptions[current]}</p>
          </ToggleTile>
        );
      })}
    </SettingsTile>
  );
};
