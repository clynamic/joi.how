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
import { defaultTransition, useVibratorValue, Vibrator } from '../../utils';
import {
  ButtplugBrowserWebsocketClientConnector,
  ButtplugClientDevice,
} from 'buttplug';
import styled from 'styled-components';
import {
  WaButton,
  WaIcon,
  WaInput,
  WaTooltip,
} from '@awesome.me/webawesome/dist/react';
import { AnimatePresence, motion } from 'framer-motion';

const StyledDeviceList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const VibratorSettings = () => {
  const [client] = useVibratorValue('client');
  const [connection, setConnection] = useVibratorValue('connection');
  const [devices, setDevices] = useVibratorValue('devices');
  const [error, setError] = useVibratorValue('error');
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
      } catch (e) {
        setError(String(e));
      } finally {
        setConnection(undefined);
        setLoading(false);
      }
      return;
    }

    try {
      const url = `ws://${host}:${port}`;
      await client.connect(new ButtplugBrowserWebsocketClientConnector(url));
      await client.startScanning();
      client.devices.forEach(e =>
        setDevices(devices => [...devices, new Vibrator(e)])
      );
      client.addListener('deviceadded', (device: ButtplugClientDevice) => {
        setDevices(devices => [...devices, new Vibrator(device)]);
      });
      client.addListener('deviceremoved', (device: ButtplugClientDevice) => {
        setDevices(devices => devices.filter(e => e.name !== device.name));
      });
      client.addListener('disconnect', () => {
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
  }, [client, connection, host, port, setConnection, setDevices, setError]);

  return (
    <Fields label={'Vibrator'}>
      <JoiStack
        direction='row'
        justifyContent='space-between'
        alignItems='center'
      >
        <JoiStack>
          <SettingsDescription>
            Use compatible device during your game
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
              devices.map((device, index) => <li key={index}>{device.name}</li>)
            ) : (
              <li>No devices found</li>
            )}
          </StyledDeviceList>
          <Space size='medium' />
        </>
      )}
      <WaButton onClick={onConnect} loading={loading} size='small'>
        <p>{connection ? 'Disconnect' : 'Connect'}</p>
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
