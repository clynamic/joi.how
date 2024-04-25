import {
  SettingsTile,
  SettingsTitle,
  ToggleTile,
  Trailing,
} from '../../common';
import {
  GameHypnoType,
  GameHypnoDescriptions,
  GameHypnoLabels,
} from '../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle, faCircleDot } from '@fortawesome/free-regular-svg-icons';
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
            role='radio'
          >
            <Trailing
              trailing={
                <h2>
                  <FontAwesomeIcon
                    icon={hypno === current ? faCircleDot : faCircle}
                  />
                </h2>
              }
            >
              <strong>{GameHypnoLabels[current]}</strong>
              <p>{GameHypnoDescriptions[current]}</p>
            </Trailing>
          </ToggleTile>
        );
      })}
    </SettingsTile>
  );
};