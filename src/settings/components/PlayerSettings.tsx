import {
  Divider,
  SettingsTile,
  SettingsTitle,
  ToggleTile,
  Trailing,
} from '../../common';
import {
  PlayerBody,
  PlayerBodyDescriptions,
  PlayerBodyLabels,
  PlayerGender,
  PlayerGenderDescriptions,
  PlayerGenderLabels,
} from '../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleDot, faCircle } from '@fortawesome/free-regular-svg-icons';
import { useSetting } from '../SettingsProvider';

export const PlayerSettings = () => {
  const [gender, setGender] = useSetting('gender');
  const [body, setBody] = useSetting('body');

  return (
    <SettingsTile label={'Player'}>
      <SettingsTitle>Select your gender</SettingsTitle>
      {Object.keys(PlayerGender).map(key => {
        const current = PlayerGender[key as keyof typeof PlayerGender];
        return (
          <ToggleTile
            key={current}
            enabled={gender === current}
            onClick={() => setGender(current)}
            role='radio'
          >
            <Trailing
              trailing={
                <h2>
                  <FontAwesomeIcon
                    icon={gender === current ? faCircleDot : faCircle}
                  />
                </h2>
              }
            >
              <strong>{PlayerGenderLabels[current]}</strong>
              <p>{PlayerGenderDescriptions[current]}</p>
            </Trailing>
          </ToggleTile>
        );
      })}
      <Divider />
      <SettingsTitle>Select your body</SettingsTitle>
      {Object.keys(PlayerBody).map(key => {
        const current = PlayerBody[key as keyof typeof PlayerBody];
        return (
          <ToggleTile
            key={current}
            enabled={body === current}
            onClick={() => setBody(current)}
            role='radio'
          >
            <Trailing
              trailing={
                <h2>
                  <FontAwesomeIcon
                    icon={body === current ? faCircleDot : faCircle}
                  />
                </h2>
              }
            >
              <strong>{PlayerBodyLabels[current]}</strong>
              <p>{PlayerBodyDescriptions[current]}</p>
            </Trailing>
          </ToggleTile>
        );
      })}
    </SettingsTile>
  );
};
