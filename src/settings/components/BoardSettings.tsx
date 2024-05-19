import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SettingsTile, SettingsDescription, ToggleTile } from '../../common';
import { useSetting } from '../SettingsProvider';
import { faVolumeMute, faVolumeUp } from '@fortawesome/free-solid-svg-icons';

export const BoardSettings = () => {
  const [highRes, setHighRes] = useSetting('highRes');
  const [videoSound, setVideoSound] = useSetting('videoSound');

  return (
    <SettingsTile label='Board'>
      <SettingsDescription>How the board is rendered</SettingsDescription>
      <ToggleTile
        value={highRes}
        onClick={() => setHighRes(!highRes)}
        trailing={highRes ? '🦄' : '🐴'}
      >
        <strong>High resolution</strong>
        <p>Use high resolution images/videos</p>
      </ToggleTile>
      <ToggleTile
        value={videoSound}
        onClick={() => setVideoSound(!videoSound)}
        trailing={
          <FontAwesomeIcon icon={videoSound ? faVolumeUp : faVolumeMute} />
        }
      >
        <strong>Video sound</strong>
        <p>Enable sound for videos</p>
      </ToggleTile>
    </SettingsTile>
  );
};
