import {
  Divider,
  SettingsTile,
  SettingsTitle,
  ToggleTile,
  ToggleTileType,
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
            type={ToggleTileType.radio}
          >
            <strong>{PlayerGenderLabels[current]}</strong>
            <p>{PlayerGenderDescriptions[current]}</p>
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
            type={ToggleTileType.radio}
          >
            <strong>{PlayerBodyLabels[current]}</strong>
            <p>{PlayerBodyDescriptions[current]}</p>
          </ToggleTile>
        );
      })}
    </SettingsTile>
  );
};
