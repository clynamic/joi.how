import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SettingsTile } from './SettingsTile';
import { faPersonDigging } from '@fortawesome/free-solid-svg-icons';

export const WalltalkerSettings = () => {
  return (
    <SettingsTile label={'Walltalker'} style={{ opacity: 0.5 }}>
      <div
        style={{
          gridColumn: '1 / -1',
          display: 'flex',
          flexDirection: 'column',
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
