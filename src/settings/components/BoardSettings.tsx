import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Fields, SettingsDescription, ToggleCard } from '../../common';
import { useSetting } from '../SettingsProvider';
import { faVolumeMute, faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import { Typography } from '@mui/material';

export const BoardSettings = () => {
  const [highRes, setHighRes] = useSetting('highRes');
  const [videoSound, setVideoSound] = useSetting('videoSound');

  return (
    <Fields label='Board'>
      <SettingsDescription>How the board is rendered</SettingsDescription>
      <ToggleCard
        value={highRes}
        onClick={() => setHighRes(!highRes)}
        trailing={highRes ? '🦄' : '🐴'}
      >
        <Typography variant='subtitle2'>High resolution</Typography>
        <Typography variant='caption'>
          Use high resolution images/videos
        </Typography>
      </ToggleCard>
      <ToggleCard
        value={videoSound}
        onClick={() => setVideoSound(!videoSound)}
        trailing={
          <FontAwesomeIcon icon={videoSound ? faVolumeUp : faVolumeMute} />
        }
      >
        <Typography variant='subtitle2'>Video sound</Typography>
        <Typography variant='caption'>Enable sound for videos</Typography>
      </ToggleCard>
    </Fields>
  );
};
