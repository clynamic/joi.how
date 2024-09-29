import {
  faCheckSquare,
  faMinusSquare,
  faRightFromBracket,
  faRss,
  faSpinner,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ToggleTile,
  ToggleTileType,
  SettingsDescription,
  Surrounded,
  IconButton,
} from '../common';
import styled from 'styled-components';
import { useWalltaker } from './WalltakerProvider';
import { AnimatePresence, motion } from 'framer-motion';
import { defaultTransition } from '../utils';
import { useEffect, useState } from 'react';
import { WalltakerLink } from './WalltakerService';
import { WalltakerCredentialsInput } from './WalltakerCredentials';
import { faSquare } from '@fortawesome/free-regular-svg-icons';

const StyledWalltakerSearch = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
`;

export const WalltakerSearch = () => {
  const {
    service,
    settings: [settings, setSettings],
    data: { connected },
  } = useWalltaker();

  const [allLinks, setAllLinks] = useState<WalltakerLink[]>([]);
  const [loading] = useState(false);

  useEffect(() => {
    if (settings.credentials) {
      service.getUserLinks(settings.credentials).then(links => {
        setAllLinks(links);
      });
    }
  }, [service, settings]);

  return (
    <StyledWalltakerSearch>
      <SettingsDescription>
        Let other users add images to your session live!
      </SettingsDescription>
      <AnimatePresence>
        {settings.credentials ? (
          <>
            <Surrounded
              trailing={
                <IconButton
                  tooltip='Log out'
                  icon={<FontAwesomeIcon icon={faRightFromBracket} />}
                  onClick={() => {
                    setSettings({ ...settings, credentials: undefined });
                  }}
                  style={{
                    padding: '10px',
                  }}
                />
              }
            >
              <ToggleTile>
                <Surrounded
                  leading={
                    <FontAwesomeIcon icon={faUser} fontSize={'0.8rem'} />
                  }
                >
                  <strong>{settings.credentials.username}</strong>
                </Surrounded>
                <p>You are connected</p>
              </ToggleTile>
            </Surrounded>
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
              <strong>Enable</strong>
              <p>Receive images from other users for this session</p>
            </ToggleTile>

            {settings.enabled && (
              <motion.div
                key='credentials-label'
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ gridColumn: '1 / -1' }}
                transition={defaultTransition}
              >
                <SettingsDescription>
                  <Surrounded
                    trailing={
                      <IconButton
                        style={{
                          fontSize: '1rem',
                        }}
                        tooltip={
                          settings.ids && settings.ids.length > 0
                            ? 'Deselect all links'
                            : 'Select all links'
                        }
                        icon={
                          <FontAwesomeIcon
                            icon={(() => {
                              if (
                                settings.ids &&
                                allLinks.length > 0 &&
                                settings.ids.length === allLinks.length
                              ) {
                                return faCheckSquare;
                              } else if (
                                settings.ids &&
                                settings.ids.length > 0
                              ) {
                                return faMinusSquare;
                              } else {
                                return faSquare;
                              }
                            })()}
                          />
                        }
                        onClick={() => {
                          if (
                            settings.ids &&
                            settings.ids.length === allLinks.length
                          ) {
                            setSettings({ ...settings, ids: [] });
                          } else {
                            setSettings({
                              ...settings,
                              ids: allLinks.map(link => link.id),
                            });
                          }
                        }}
                      />
                    }
                  >
                    Links
                  </Surrounded>
                </SettingsDescription>
                {allLinks.map(link => {
                  return (
                    <ToggleTile
                      key={link.id}
                      value={settings.ids?.includes(link.id) ?? false}
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
                      type={ToggleTileType.check}
                    >
                      <strong>#{link.id}</strong>
                      <p
                        dangerouslySetInnerHTML={{
                          __html: link.terms,
                        }}
                      />
                    </ToggleTile>
                  );
                })}
              </motion.div>
            )}
          </>
        ) : (
          <WalltakerCredentialsInput
            service={service}
            onSaved={credentials => {
              setSettings({ ...settings, credentials });
            }}
            disabled={loading}
          />
        )}
      </AnimatePresence>
    </StyledWalltakerSearch>
  );
};
