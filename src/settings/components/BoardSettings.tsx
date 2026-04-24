import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Fields,
  JoiToggleTile,
  SettingsDescription,
  SettingsRow,
  SettingsLabel,
  Measure,
  SettingsDivider,
  Space,
} from '../../common';
import { useSetting } from '../SettingsProvider';
import { faVolumeMute, faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import { WaSlider } from '@awesome.me/webawesome/dist/react';

export const BoardSettings = () => {
  const [highRes, setHighRes] = useSetting('highRes');
  const [videoSound, setVideoSound] = useSetting('videoSound');
  const [imageDuration, setImageDuration] = useSetting('imageDuration');
  const [intenseImages, setIntenseImages] = useSetting('intenseImages');

  return (
    <Fields label='Board'>
      <SettingsDescription>How the board is rendered</SettingsDescription>
      <JoiToggleTile value={highRes} onClick={() => setHighRes(!highRes)}>
        <h6 className='subtitle'>High resolution</h6>
        <p className='caption'>Use high resolution images/videos</p>
        <span slot='trailing'>{highRes ? '🦄' : '🐴'}</span>
      </JoiToggleTile>
      <Space size='small' />
      <SettingsRow>
        <SettingsLabel htmlFor='imageDuration'>Image Duration</SettingsLabel>
        <WaSlider
          id='imageDuration'
          min={10}
          max={60}
          step={1}
          value={imageDuration}
          onInput={e =>
            setImageDuration(parseFloat(e.currentTarget.value.toString()))
          }
          style={{ width: '100%' }}
        />
        <Measure value={imageDuration} chars={2} unit='s' />
      </SettingsRow>
      <Space size='small' />
      <JoiToggleTile
        value={intenseImages}
        onClick={() => setIntenseImages(!intenseImages)}
      >
        <h6>Intense images</h6>
        <p className='caption'>Switch faster as intensity increases</p>
        <span slot='trailing'>{intenseImages ? '⚡' : '🐌'}</span>
      </JoiToggleTile>
      <SettingsDivider />
      <JoiToggleTile
        value={videoSound}
        onClick={() => setVideoSound(!videoSound)}
      >
        <h6>Video sound</h6>
        <p className='caption'>Enable sound for videos</p>
        <span slot='trailing'>
          <FontAwesomeIcon icon={videoSound ? faVolumeUp : faVolumeMute} />
        </span>
      </JoiToggleTile>
    </Fields>
  );
};
