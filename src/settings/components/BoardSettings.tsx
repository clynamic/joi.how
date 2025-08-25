import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Fields, JoiToggleTile, SettingsDescription } from '../../common';
import { useSetting } from '../SettingsProvider';
import { faVolumeMute, faVolumeUp } from '@fortawesome/free-solid-svg-icons';

export const BoardSettings = () => {
  const [highRes, setHighRes] = useSetting('highRes');
  const [videoSound, setVideoSound] = useSetting('videoSound');

  return (
    <Fields label='Board'>
      <SettingsDescription>How the board is rendered</SettingsDescription>
      <JoiToggleTile value={highRes} onClick={() => setHighRes(!highRes)}>
        <h6 className='subtitle'>High resolution</h6>
        <p className='caption'>Use high resolution images/videos</p>
        <span slot='trailing'>{highRes ? '🦄' : '🐴'}</span>
      </JoiToggleTile>
      <JoiToggleTile
        value={videoSound}
        onClick={() => setVideoSound(!videoSound)}
      >
        <h6 className='subtitle'>Video sound</h6>
        <p className='caption'>Enable sound for videos</p>
        <span slot='trailing'>
          <FontAwesomeIcon icon={videoSound ? faVolumeUp : faVolumeMute} />
        </span>
      </JoiToggleTile>
    </Fields>
  );
};
