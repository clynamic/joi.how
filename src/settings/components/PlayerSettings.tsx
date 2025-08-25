import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Fields,
  SettingsDescription,
  SettingsDivider,
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
    <Fields label={'Player'}>
      <SettingsDescription>Select your gender</SettingsDescription>
      {Object.keys(PlayerGender).map(key => {
        const current = PlayerGender[key as keyof typeof PlayerGender];
        return (
          <ToggleTile
            key={current}
            value={gender === current}
            onClick={() => setGender(current)}
          >
            <h6 className='subtitle'>{PlayerGenderLabels[current]}</h6>
            <p className='caption'>{PlayerGenderDescriptions[current]}</p>
            <p slot='trailing'>
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
            </p>
          </ToggleTile>
        );
      })}
      <SettingsDivider />
      <SettingsDescription>Select your body</SettingsDescription>
      {Object.keys(PlayerBody).map(key => {
        const current = PlayerBody[key as keyof typeof PlayerBody];
        return (
          <ToggleTile
            key={current}
            value={body === current}
            onClick={() => setBody(current)}
          >
            <h6 className='subtitle2'>{PlayerBodyLabels[current]}</h6>
            <p className='caption'>{PlayerBodyDescriptions[current]}</p>
            <p slot='trailing'>
              {(() => {
                switch (current) {
                  case PlayerBody.penis:
                    return '🍆';
                  case PlayerBody.vagina:
                    return '🍑';
                  case PlayerBody.neuter:
                    return '🥝';
                }
              })()}
            </p>
          </ToggleTile>
        );
      })}
    </Fields>
  );
};
