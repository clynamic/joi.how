import { SettingsTile, ToggleTile, ToggleTileType } from '../../common';
import {
  faSpinner,
  faSquare,
  faCheckSquare,
  faPowerOff,
} from '@fortawesome/free-solid-svg-icons';
import { usePornSocketService } from '../../utils/porn-socket/porn-socket-service.tsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';
import { useSetting } from '../SettingsProvider.tsx';

const Header = styled.div`
    display: flex;
    gap: 1ex;
    align-items: center;
`;

export const WalltalkerSettings = () => {
  const [config, setConfig] = useSetting('walltaker');
  const service = usePornSocketService(config.enabled);

  return (
    <SettingsTile label={'Walltalker'}>
      <ToggleTile
        value={config.enabled && service.enabled && service.ready}
        onClick={() => {
          setConfig({ ...config, enabled: !service.enabled });
          service.setEnabled(!service.enabled);
        }}
        type={ToggleTileType.radio}
        trailing={service.enabled && !service.ready ? <FontAwesomeIcon icon={faSpinner} spinPulse /> : <FontAwesomeIcon icon={faPowerOff} />}
      >
        <strong>Use Walltaker</strong>
        <p>Let others choose wallpapers for your session, live!</p>
      </ToggleTile>
      <Header>
        {service.enabled && service.ready && (
          <>
            <FontAwesomeIcon icon={faCheckSquare} />
            <span>Ready!</span>
          </>
        )}
        {service.enabled && !service.ready && (
          <>
            <FontAwesomeIcon icon={faSpinner} spinPulse />
            <span>Connecting...</span>
          </>
        )}
        {!service.enabled && (
          <>
            <FontAwesomeIcon icon={faSquare} />
            <span>Disabled</span>
          </>
        )}
      </Header>
    </SettingsTile>
  );
};
