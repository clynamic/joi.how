import { useCallback, useState } from 'react';
import {
  Button,
  SettingsDescription,
  SettingsTile,
  SettingsTitle,
  Space,
} from '../../common';
import { useVibratorValue, Vibrator } from '../../utils';
import {
  ButtplugBrowserWebsocketClientConnector,
  ButtplugClientDevice,
} from 'buttplug';
import styled from 'styled-components';

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

  const onConnect = useCallback(async () => {
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
      const url = 'ws://127.0.0.1:12345';
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
      setError(String(e));
      setConnection(undefined);
    } finally {
      setLoading(false);
    }
  }, [client, connection, setConnection, setDevices, setError]);

  return (
    <SettingsTile label={'Vibrator'}>
      <SettingsTitle>Use compatible device during your game.</SettingsTitle>
      <SettingsDescription
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
            .
          </p>
        )}
      </SettingsDescription>
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
      <Button
        style={{
          width: 'fit-content',
          alignSelf: 'center',
        }}
        onClick={onConnect}
        disabled={loading}
      >
        {connection ? <strong>Disconnect</strong> : <strong>Connect</strong>}
      </Button>
      {error && (
        <>
          <Space size='small' />
          <SettingsDescription style={{ color: 'red' }}>
            {error}
          </SettingsDescription>
        </>
      )}
      <Space size='small' />
    </SettingsTile>
  );
};
