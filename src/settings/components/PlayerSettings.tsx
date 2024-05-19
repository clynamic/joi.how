import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Divider,
  SettingsTile,
  SettingsDescription,
  ToggleTile,
} from '../../common';
import {
  PlayerBody,
  PlayerBodyDescriptions,
  PlayerBodyLabels,
  PlayerGender,
  PlayerGenderDescriptions,
  PlayerGenderLabels,
} from '../../types';
import { useSetting } from '../SettingsProvider';
import {
  faMars,
  faMarsAndVenus,
  faVenus,
} from '@fortawesome/free-solid-svg-icons';

export const PlayerSettings = () => {
  const [gender, setGender] = useSetting('gender');
  const [body, setBody] = useSetting('body');

  return (
    <SettingsTile label={'Player'}>
      <SettingsDescription>Select your gender</SettingsDescription>
      {Object.keys(PlayerGender).map(key => {
        const current = PlayerGender[key as keyof typeof PlayerGender];
        return (
          <ToggleTile
            key={current}
            value={gender === current}
            onClick={() => setGender(current)}
            trailing={
              <FontAwesomeIcon
                style={{ aspectRatio: 1 }}
                icon={(() => {
                  switch (current) {
                    case PlayerGender.male:
                      return faMars;
                    case PlayerGender.female:
                      return faVenus;
                    case PlayerGender.other:
                      return faMarsAndVenus;
                  }
                })()}
              />
            }
          >
            <strong>{PlayerGenderLabels[current]}</strong>
            <p>{PlayerGenderDescriptions[current]}</p>
          </ToggleTile>
        );
      })}
      <Divider />
      <SettingsDescription>Select your body</SettingsDescription>
      {Object.keys(PlayerBody).map(key => {
        const current = PlayerBody[key as keyof typeof PlayerBody];
        return (
          <ToggleTile
            key={current}
            value={body === current}
            onClick={() => setBody(current)}
            trailing={(() => {
              switch (current) {
                case PlayerBody.penis:
                  return '🍆';
                case PlayerBody.vagina:
                  return '🍑';
                case PlayerBody.neuter:
                  return '🥝';
              }
            })()}
          >
            <strong>{PlayerBodyLabels[current]}</strong>
            <p>{PlayerBodyDescriptions[current]}</p>
          </ToggleTile>
        );
      })}
    </SettingsTile>
  );
};
