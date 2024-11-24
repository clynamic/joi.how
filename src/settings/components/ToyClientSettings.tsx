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
import { useToyClientValue, ToyClient } from '../../toy';
import {
  ButtplugBrowserWebsocketClientConnector,
  ButtplugClientDevice,
  ButtplugClient,
} from 'buttplug';
import styled from 'styled-components';
import {
  WaButton,
  WaIcon,
  WaInput,
  WaTooltip,
} from '@awesome.me/webawesome/dist/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ToySettings } from './ToySettings';

const StyledDeviceList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const VibratorSettings = () => {
  const [client, setClient] = useToyClientValue('client');
  const [connection, setConnection] = useToyClientValue('connection');
  const [devices, setDevices] = useToyClientValue('devices');
  const [error, setError] = useToyClientValue('error');
  const [loading, setLoading] = useState(false);

  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState(12345);

  const [expanded, setExpanded] = useState(false);

  const onConnect = useCallback(async () => {
    setExpanded(false);
    setError(undefined);
    setLoading(true);

    if (connection) {
      try {
        await client.disconnect();
        setClient(new ButtplugClient('JOI.how'));
      } catch (e) {
        setError(String(e));
      } finally {
        setConnection(undefined);
        setLoading(false);
      }
      return;
    }

    try {
      const isLocalhost =
        host === 'localhost' || host === '127.0.0.1' || host === '::1';
      const protocol = isLocalhost ? 'ws' : 'wss';
      const url = `${protocol}://${host}:${port}`;
      await client.connect(new ButtplugBrowserWebsocketClientConnector(url));
      await client.startScanning();
      client.devices.forEach(e =>
        setDevices(devices => [...devices, new ToyClient(e)])
      );
      client.addListener('deviceadded', (device: ButtplugClientDevice) => {
        setDevices(devices => [...devices, new ToyClient(device)]);
      });
      client.addListener('deviceremoved', (device: ButtplugClientDevice) => {
        setDevices(devices => devices.filter(e => e.name !== device.name));
      });
      client.addListener('disconnect', () => {
        client.removeListener('deviceadded');
        client.removeListener('deviceremoved');
        client.removeListener('disconnect');
        setDevices([]);
        setConnection(undefined);
      });
      setConnection(url);
    } catch (e) {
      setError(String(e ?? 'Unknown error'));
      setConnection(undefined);
    } finally {
      setLoading(false);
    }
  }, [
    client,
    connection,
    host,
    port,
    setClient,
    setConnection,
    setDevices,
    setError,
  ]);

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
        <WaTooltip for='vibrator-settings-toggle'>Settings</WaTooltip>
        <WaButton
          id='vibrator-settings-toggle'
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
