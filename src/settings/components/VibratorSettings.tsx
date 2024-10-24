import { useCallback, useState } from 'react';
import {
  Button,
  SettingsInfo,
  SettingsTile,
  SettingsDescription,
  Space,
  Surrounded,
  IconButton,
  TextInput,
  SettingsLabel,
  Spinner,
} from '../../common';
import { defaultTransition, useVibratorValue, Vibrator } from '../../utils';
import {
  ButtplugBrowserWebsocketClientConnector,
  ButtplugClientDevice,
} from 'buttplug';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { AnimatePresence, motion } from 'framer-motion';
import { ToySettings } from './ToySettings';

const StyledDeviceList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const StyledUrlFields = styled.div`
  display: grid;
  grid-template-columns: auto 1fr 56px;
  grid-gap: 8px;

  align-items: center;

  input {
    grid-column: unset;
  }
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
    <SettingsTile label={'Vibrator'}>
      <Surrounded
        trailing={
          <IconButton
            style={{
              fontSize: '1rem',
            }}
            tooltip='Settings'
            icon={<FontAwesomeIcon icon={faGear} />}
            onClick={() => setExpanded(!expanded)}
            disabled={loading}
          />
        }
      >
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
      </Surrounded>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ gridColumn: '1 / -1' }}
            transition={defaultTransition}
          >
            <Space size='medium' />
            <StyledUrlFields>
              <SettingsLabel>Server</SettingsLabel>
              <TextInput
                placeholder='Host'
                value={host}
                onChange={setHost}
                disabled={loading}
              />
              <TextInput
                placeholder='Port'
                value={port.toString()}
                onChange={e => setPort(Number(e))}
                disabled={loading}
              />
            </StyledUrlFields>
            <Space size='small' />
          </motion.div>
        )}
      </AnimatePresence>
      <Space size='medium' />
      {connection && (
        <>
          <StyledDeviceList>
            {devices.length > 0 ? (
              devices.map((device: Vibrator, index: number) => (
                <ToySettings key={index} device={device} />
              ))
            ) : (
              <li>No devices found</li>
            )}
          </StyledDeviceList>
          <Space size='medium' />
        </>
      )}
      <Button
        style={{
          width: 'fit-content',
          alignSelf: 'center',
        }}
        onClick={onConnect}
        disabled={loading}
      >
        {loading ? (
          <Spinner />
        ) : connection ? (
          <strong>Disconnect</strong>
        ) : (
          <strong>Connect</strong>
        )}
      </Button>
      {error && (
        <>
          <Space size='small' />
          <SettingsInfo style={{ color: 'red', textAlign: 'center' }}>
            {error}
          </SettingsInfo>
        </>
      )}
      <Space size='small' />
    </SettingsTile>
  );
};
