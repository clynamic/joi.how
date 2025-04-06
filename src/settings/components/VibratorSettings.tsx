import { useCallback, useState } from 'react';
import { defaultTransition, useVibratorValue, Vibrator } from '../../utils';
import {
  ButtplugBrowserWebsocketClientConnector,
  ButtplugClientDevice,
} from 'buttplug';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Box,
  Button,
  IconButton,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Fields,
  SettingsDescription,
  SettingsInfo,
  SettingsLabel,
  Space,
  Spinner,
} from '../../common';
import SettingsIcon from '@mui/icons-material/Settings';

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
      <Stack direction='row' alignItems='center'>
        <Stack direction='column' flex={1}>
          <SettingsDescription>
            Use compatible device during your game
          </SettingsDescription>
          <SettingsInfo sx={{ margin: 0 }}>
            {connection ? (
              <Typography variant='inherit'>
                Connected to{' '}
                <Typography fontWeight='bold'>{connection}</Typography>
              </Typography>
            ) : (
              <Typography variant='inherit'>
                This requires you to install{' '}
                <Link
                  href='https://intiface.com/central/'
                  target={'_blank'}
                  rel='noreferrer'
                >
                  Intiface® Central
                </Link>
              </Typography>
            )}
          </SettingsInfo>
        </Stack>
        <IconButton
          size='small'
          onClick={() => setExpanded(!expanded)}
          disabled={loading}
        >
          <SettingsIcon />
        </IconButton>
      </Stack>
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
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto 56px',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <SettingsLabel>Server</SettingsLabel>
              <TextField
                variant='outlined'
                placeholder='Host'
                value={host}
                onChange={e => setHost(e.target.value)}
                disabled={loading}
              />
              <Typography>:</Typography>
              <TextField
                variant='outlined'
                placeholder='Port'
                value={port.toString()}
                onChange={e => setPort(Number(e.target.value))}
                disabled={loading}
                inputMode='numeric'
              />
            </Box>
            <Space size='small' />
          </motion.div>
        )}
      </AnimatePresence>
      <Space size='medium' />
      {connection && (
        <Stack direction='column'>
          <Box
            component='ul'
            sx={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}
          >
            {devices.length > 0 ? (
              devices.map((device, index) => <li key={index}>{device.name}</li>)
            ) : (
              <li>No devices found</li>
            )}
          </Box>
          <Space size='medium' />
        </Stack>
      )}
      <Stack direction='column' alignItems='center'>
        <Button variant='contained' onClick={onConnect} disabled={loading}>
          <Typography>
            {loading ? <Spinner /> : connection ? 'Disconnect' : 'Connect'}
          </Typography>
        </Button>
        {error && (
          <Stack direction='column'>
            <Space size='small' />
            <SettingsInfo style={{ color: 'red', textAlign: 'center' }}>
              {error}
            </SettingsInfo>
          </Stack>
        )}
        <Space size='small' />
      </Stack>
    </Fields>
  );
};
