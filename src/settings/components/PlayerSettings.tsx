import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Fields,
  SettingsDescription,
  SettingsDivider,
  ToggleCard,
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
import { Typography } from '@mui/material';

export const PlayerSettings = () => {
  const [gender, setGender] = useSetting('gender');
  const [body, setBody] = useSetting('body');

  return (
    <Fields label={'Player'}>
      <SettingsDescription>Select your gender</SettingsDescription>
      {Object.keys(PlayerGender).map(key => {
        const current = PlayerGender[key as keyof typeof PlayerGender];
        return (
          <ToggleCard
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
            <Typography variant='subtitle2'>
              {PlayerGenderLabels[current]}
            </Typography>
            <Typography variant='caption'>
              {PlayerGenderDescriptions[current]}
            </Typography>
          </ToggleCard>
        );
      })}
      <SettingsDivider />
      <SettingsDescription>Select your body</SettingsDescription>
      {Object.keys(PlayerBody).map(key => {
        const current = PlayerBody[key as keyof typeof PlayerBody];
        return (
          <ToggleCard
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
            <Typography variant='subtitle2'>
              {PlayerBodyLabels[current]}
            </Typography>
            <Typography variant='caption'>
              {PlayerBodyDescriptions[current]}
            </Typography>
          </ToggleCard>
        );
      })}
    </Fields>
  );
};
