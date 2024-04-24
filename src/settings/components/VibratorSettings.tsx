import { faPersonDigging } from '@fortawesome/free-solid-svg-icons';
import { SettingsTile } from '../../common';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const VibratorSettings = () => {
  return (
    <SettingsTile label={'Vibrator'} style={{ opacity: 0.5 }}>
      <div
        style={{
          gridColumn: '1 / -1',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <h1>
          <FontAwesomeIcon icon={faPersonDigging} />
        </h1>
        <p>There is nothing here yet :3</p>
      </div>
    </SettingsTile>
  );
};
