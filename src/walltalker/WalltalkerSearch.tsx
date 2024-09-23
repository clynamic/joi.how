import { faRss, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ToggleTile,
  ToggleTileType,
  SettingsDescription,
  SettingsLabel,
  TextInput,
} from '../common';
import styled from 'styled-components';
import { useWalltalker } from './WalltalkerProvider';
import { motion } from 'framer-motion';
import { defaultTransition } from '../utils';
import { useCallback, useState } from 'react';
import { WalltalkerLink } from './WalltalkerService';

const StyledWalltalkerSearch = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
`;

const StyledLinksForm = styled.div`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
`;

export const WalltalkerSearch = () => {
  const {
    service,
    settings: [settings, setSettings],
    data: { connected },
  } = useWalltalker();

  const [searchLinks, setSearchLinks] = useState<WalltalkerLink[]>([]);
  const [, setLoading] = useState(false);

  const findLinks = useCallback(async () => {
    setLoading(true);
    if (!settings.username) return;
    const links = await service.getLinksFromUsername(settings.username);
    setSearchLinks(links);
    setLoading(false);
  }, [service, settings.username]);

  return (
    <StyledWalltalkerSearch>
      <SettingsDescription>
        Automatically add images from your Walltalker links!
      </SettingsDescription>
      <StyledLinksForm>
        <SettingsLabel htmlFor='username'>Username</SettingsLabel>
        <TextInput
          id='username'
          value={settings.username}
          onChange={value => {
            setSettings({ ...settings, username: value });
          }}
          onSubmit={findLinks}
          placeholder='Enter walltaker username...'
          style={{ gridColumn: '2 / -1' }}
          disabled={!connected}
        />
      </StyledLinksForm>
      <ToggleTile
        value={connected ?? false}
        onClick={() => {
          setSettings({ ...settings, enabled: !settings.enabled });
        }}
        type={ToggleTileType.radio}
        trailing={
          settings.enabled && !connected ? (
            <FontAwesomeIcon icon={faSpinner} spinPulse />
          ) : (
            <FontAwesomeIcon icon={faRss} />
          )
        }
      >
        <strong>Connect</strong>
        <p>Let others choose wallpapers for your session, live!</p>
      </ToggleTile>

      {connected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{ gridColumn: '1 / -1' }}
          transition={defaultTransition}
        >
          <SettingsDescription>Links</SettingsDescription>
          {searchLinks.map(link => {
            return (
              <ToggleTile
                key={link.id}
                value={settings.ids?.includes(link.id)}
                onClick={() => {
                  if (settings.ids?.includes(link.id)) {
                    setSettings({
                      ...settings,
                      ids: settings.ids?.filter(id => id !== link.id),
                    });
                  } else {
                    setSettings({
                      ...settings,
                      ids: [...(settings.ids ?? []), link.id],
                    });
                  }
                }}
                type={ToggleTileType.radio}
              >
                <strong>#{link.id}</strong>
                {/* dangerously set inner html */}
                <p dangerouslySetInnerHTML={{ __html: link.terms }} />
              </ToggleTile>
            );
          })}
        </motion.div>
      )}
    </StyledWalltalkerSearch>
  );
};
