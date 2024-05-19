import { Button, SettingsLabel, SettingsTile, Spinner, TextInput, ToggleTile, ToggleTileType } from '../../common';
import {
  faSpinner,
  faSquare,
  faCheckSquare,
  faPowerOff
} from '@fortawesome/free-solid-svg-icons';
import { usePornSocketService } from '../../utils/porn-socket/porn-socket-service.tsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';
import { useSetting } from '../SettingsProvider.tsx';
import { useEffect, useState } from 'react';
import { LinkResponse, WalltakerSocketService } from '../../utils/porn-socket/walltaker.tsx';
import { defaultTransition } from '../../utils';
import { motion } from 'framer-motion';

const Header = styled.div`
    display: flex;
    gap: 1ex;
    align-items: center;
    margin-bottom: 0.75rem;
`;

const StyledLinksForm = styled.div`
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.75rem;
`;

export const WalltalkerSettings = () => {
  const [config, setConfig] = useSetting('walltaker');
  const service = usePornSocketService(config.enabled);

  const [username, setUsername] = useState<string>('');
  const [loadingLinks, setLoadingLinks] = useState<boolean>(false);
  const [loadingLink, setLoadingLink] = useState<boolean>(false);
  const [links, setLinks] = useState<LinkResponse[]>([]);

  const [listenedLink, setListenedLink] = useState<LinkResponse | null>(null);

  useEffect(() => {
    if (config.id && service.ready) {
      setLoadingLink(true);

      service.service?.listenTo(config.id)
        .then(() => WalltakerSocketService.getLink(config.id ?? 0))
        .then(link => link && setListenedLink(link))
        .finally(() => setLoadingLink(false));
    }

    return () => {
      if (config.id) service.service?.muteFrom(config.id).catch(() => setListenedLink(null));
    };
  }, [config.id, service.enabled, service.ready, service.service]);

  const getLinks = () => {
    setLoadingLinks(true);

    WalltakerSocketService.getLinksFromUsername(username)
      .then((links) => setLinks(links ?? []))
      .catch(() => setLinks([]))
      .finally(() => setLoadingLinks(false));
  };

  const enabledAndReady = config.enabled && service.enabled && service.ready;

  return (
    <SettingsTile label="Walltalker">
      <ToggleTile
        value={enabledAndReady}
        onClick={() => {
          setConfig({ ...config, enabled: !service.enabled });
          service.setEnabled(!service.enabled);
        }}
        type={ToggleTileType.radio}
        trailing={service.enabled && !service.ready ? <FontAwesomeIcon icon={faSpinner} spinPulse /> :
          <FontAwesomeIcon icon={faPowerOff} />}
      >
        <strong>Use Walltaker</strong>
        <p>Let others choose wallpapers for your session, live!</p>
      </ToggleTile>
      <Header>
        {service.enabled && service.ready && !loadingLink && !listenedLink && (
          <>
            <FontAwesomeIcon icon={faCheckSquare} />
            <span>Ready!</span>
          </>
        )}
        {service.enabled && service.ready && !loadingLink && listenedLink && (
          <>
            <FontAwesomeIcon icon={faCheckSquare} />
            <span>Listening to {listenedLink.id}</span>
            <a href={`https://walltaker.joi.how/links/${listenedLink.id}`} target="_blank">Change Wallpaper</a>
          </>
        )}
        {service.enabled && !service.ready && (
          <>
            <FontAwesomeIcon icon={faSpinner} spinPulse />
            <span>Connecting...</span>
          </>
        )}
        {service.enabled && service.ready && loadingLink && (
          <>
            <FontAwesomeIcon icon={faSpinner} spinPulse />
            <span>Waiting for #{config.id}</span>
          </>
        )}
        {!service.enabled && (
          <>
            <FontAwesomeIcon icon={faSquare} />
            <span>Disabled</span>
          </>
        )}
      </Header>

      {enabledAndReady && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{ gridColumn: '1 / -1' }}
          transition={defaultTransition}
        >
          <StyledLinksForm>
            <SettingsLabel htmlFor="username">Username</SettingsLabel>
            <TextInput
              id="username"
              value={username}
              onChange={setUsername}
              onSubmit={getLinks}
              placeholder="Enter walltaker username..."
              style={{ gridColumn: '2 / -1' }}
              disabled={!enabledAndReady}
            />
            <Button
              onClick={getLinks}
              disabled={!enabledAndReady}
              style={{
                gridColumn: '1 / -1',
                justifySelf: 'center',
              }}
            >
              {loadingLinks ? <Spinner /> : <strong>Search</strong>}
            </Button>
          </StyledLinksForm>

          {links.map(link => {
            return (
              <ToggleTile
                key={link.id}
                value={config.id === link.id}
                onClick={() => setConfig({ ...config, id: link.id })}
                type={ToggleTileType.radio}
              >
                <strong>#{link.id}</strong>
                <p>{link.terms}</p>
              </ToggleTile>
            );
          })}
        </motion.div>
      )}
    </SettingsTile>
  );
};
