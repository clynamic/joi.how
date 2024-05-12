import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SettingsTile, ToggleTile, Surrounded } from '../../common';
import { useSetting } from '../SettingsProvider';
import { faVolumeMute, faVolumeUp } from '@fortawesome/free-solid-svg-icons';

export const BoardSettings = () => {
  const [highRes, setHighRes] = useSetting('highRes');
  const [videoSound, setVideoSound] = useSetting('videoSound');

  return (
    <SettingsTile label='Board'>
      <ToggleTile value={highRes} onClick={() => setHighRes(!highRes)}>
        <Surrounded trailing={highRes ? '🦄' : '🐴'}>
          <strong>High resolution</strong>
          <p>Use high resolution images/videos.</p>
        </Surrounded>
      </ToggleTile>
      <ToggleTile value={videoSound} onClick={() => setVideoSound(!videoSound)}>
        <Surrounded
          trailing={
            <FontAwesomeIcon icon={videoSound ? faVolumeUp : faVolumeMute} />
          }
        >
          <strong>Video sound</strong>
          <p>Enable sound for videos.</p>
        </Surrounded>
      </ToggleTile>
    </SettingsTile>
  );
};
