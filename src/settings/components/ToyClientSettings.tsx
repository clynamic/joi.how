import { useCallback, useState } from 'react';
import {
  SettingsInfo,
  SettingsDescription,
  Space,
  SettingsLabel,
  Fields,
  SettingsRow,
  SettingsGrid,
  JoiStack,
} from '../../common';
import { defaultTransition } from '../../utils';
import { ToyClient } from '../../toy';
import styled from 'styled-components';
import {
  WaButton,
  WaIcon,
  WaInput,
  WaTooltip,
} from '@awesome.me/webawesome/dist/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ToySettings } from './ToySettings';
import Toy, { ToyState } from '../../game/plugins/toy';
import { useGameFrame, useDispatchEvent } from '../../game/hooks';

const StyledDeviceList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;

  display: flex;
  flex-direction: column;
  gap: var(--wa-space-s);

  li {
    margin-inline-start: 0;
  }
`;

export const ToyListSettings = () => {
  const { connection, error, connecting } =
    useGameFrame<ToyState>(Toy.paths) ?? {};
  const { inject } = useDispatchEvent();
  const loading = connecting ?? false;

  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState(12345);

  const [expanded, setExpanded] = useState(false);

  const onConnect = useCallback(() => {
    setExpanded(false);

    if (connection) {
      inject(Toy.disconnect());
      return;
    }

    const isLocalhost =
      host === 'localhost' || host === '127.0.0.1' || host === '::1';
    const protocol = isLocalhost ? 'ws' : 'wss';
    inject(Toy.connect(`${protocol}://${host}:${port}`));
  }, [connection, host, port, inject]);

  const devices = Toy.devices();

  return (
    <Fields label={'Connect Devices'}>
      <JoiStack
        direction='row'
        justifyContent='space-between'
        alignItems='center'
      >
        <JoiStack>
          <SettingsDescription>
            Use compatible devices during your game
          </SettingsDescription>
          <SettingsInfo
            style={{
              margin: 0,
            }}
          >
            {connection ? (
              <p>
                Connected to <strong>{connection}</strong>
              </p>
            ) : (
              <p>
                This requires you to install{' '}
                <a
                  href='https://intiface.com/central/'
                  target={'_blank'}
                  rel='noreferrer'
                >
                  Intiface® Central
                </a>
              </p>
            )}
          </SettingsInfo>
        </JoiStack>
        <WaTooltip for='toy-settings-toggle'>Settings</WaTooltip>
        <WaButton
          id='toy-settings-toggle'
          onClick={() => setExpanded(!expanded)}
          disabled={loading}
        >
          <WaIcon name='gear' />
        </WaButton>
      </JoiStack>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={defaultTransition}
          >
            <Space size='medium' />
            <SettingsGrid>
              <SettingsRow>
                <SettingsLabel>Server</SettingsLabel>
                <WaInput
                  className='joi-wide'
                  placeholder='Host'
                  value={host}
                  onInput={e => setHost(e.currentTarget.value || '')}
                  disabled={loading}
                />
                <WaInput
                  className='joi-wide'
                  placeholder='Port'
                  value={port.toString()}
                  onInput={e => setPort(Number(e.currentTarget.value))}
                  disabled={loading}
                  style={{ width: '4em' }}
                />
              </SettingsRow>
            </SettingsGrid>
          </motion.div>
        )}
      </AnimatePresence>
      <Space size='medium' />
      {connection && (
        <>
          <StyledDeviceList>
            {devices.length > 0 ? (
              devices.map((device: ToyClient, index: number) => (
                <ToySettings device={device} key={`${device.name}${index}`} />
              ))
            ) : (
              <li>No devices found</li>
            )}
          </StyledDeviceList>
          <Space size='medium' />
        </>
      )}
      <WaButton onClick={onConnect} loading={loading} size='small'>
        <span>{connection ? 'Disconnect' : 'Connect'}</span>
        <WaIcon slot='end' name='satellite-dish' />
      </WaButton>
      {error && (
        <>
          <Space size='small' />
          <SettingsInfo
            style={{
              color: 'var(--wa-color-danger-fill-loud)',
              textAlign: 'center',
            }}
          >
            {error}
          </SettingsInfo>
        </>
      )}
    </Fields>
  );
};
