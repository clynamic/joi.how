import { faSpinner, faWalkieTalkie } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ToggleTile,
  ToggleTileType,
  SettingsDescription,
  SettingsLabel,
  TextInput,
  Button,
  Spinner,
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
  const { service, settings: settingsRef, data } = useWalltalker();

  const [settings, setSettings] = settingsRef;
  const { connected } = data;

  const [searchLinks, setSearchLinks] = useState<WalltalkerLink[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
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
      <ToggleTile
        value={connected}
        onClick={() => {
          setSettings({ ...settings, enabled: !settings.enabled });
        }}
        type={ToggleTileType.radio}
        trailing={
          settings.enabled && !connected ? (
            <FontAwesomeIcon icon={faSpinner} spinPulse />
          ) : (
            <FontAwesomeIcon icon={faWalkieTalkie} />
          )
        }
      >
        <strong>Use Walltaker</strong>
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
          <StyledLinksForm>
            <SettingsLabel htmlFor='username'>Username</SettingsLabel>
            <TextInput
              id='username'
              value={settings.username}
              onChange={value => {
                setSettings({ ...settings, username: value });
              }}
              onSubmit={search}
              placeholder='Enter walltaker username...'
              style={{ gridColumn: '2 / -1' }}
              disabled={!connected}
            />
            <Button
              onClick={search}
              disabled={!connected}
              style={{
                gridColumn: '1 / -1',
                justifySelf: 'center',
              }}
            >
              {loading ? <Spinner /> : <strong>Search</strong>}
            </Button>
          </StyledLinksForm>
          <SettingsDescription>Search results</SettingsDescription>
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
