import {
  Box,
  Typography,
  TextField,
  CircularProgress,
  Button,
} from '@mui/material';
import { useState, useCallback, useMemo } from 'react';
import { E621Credentials } from './E621Provider';
import { E621Service } from './E621Service';
import { SettingsGrid, SettingsInfo, SettingsRow } from '../common';

export interface E621CredentialsInputProps {
  service: E621Service;
  initialValue?: Partial<E621Credentials>;
  onSaved?: (credentials: E621Credentials) => void;
  disabled?: boolean;
}

export const E621CredentialsInput = ({
  service,
  initialValue,
  onSaved,
  disabled,
}: E621CredentialsInputProps) => {
  const [input, setInput] = useState<Partial<E621Credentials>>({
    ...initialValue,
    username: '',
    apiKey: '',
  });
  const [loading, setLoading] = useState(false);

  const onSave = useCallback(async () => {
    setLoading(true);
    const valid = await service.testCredentials(input as E621Credentials);
    if (valid) {
      onSaved?.(input as E621Credentials);
    }
    setLoading(false);
  }, [input, onSaved, service]);

  const hasData = useMemo(
    () => input?.username && input?.apiKey,
    [input?.username, input?.apiKey]
  );

  const locked = useMemo(() => loading || disabled, [loading, disabled]);

  return (
    <SettingsGrid>
      <SettingsInfo>
        <Typography variant='caption'>
          Access your API key from{' '}
          <a
            href='https://e621.net/users/home'
            target='_blank'
            rel='noreferrer'
          >
            your profile
          </a>
          .
        </Typography>
      </SettingsInfo>
      <SettingsRow>
        <Typography variant='body2'>Username</Typography>
        <TextField
          variant='outlined'
          size='small'
          fullWidth
          value={input?.username}
          onChange={e => setInput({ ...input, username: e.target.value })}
          placeholder='Username'
          autoComplete='username'
          disabled={locked}
          sx={{ gridColumn: '2 / -1' }}
        />
      </SettingsRow>
      <Box height={8} />
      <SettingsRow>
        <Typography variant='body2'>API Key</Typography>
        <TextField
          variant='outlined'
          size='small'
          type='password'
          fullWidth
          value={input?.apiKey}
          onChange={e => setInput({ ...input, apiKey: e.target.value })}
          placeholder='API Key'
          autoComplete='current-password'
          disabled={locked}
          sx={{ gridColumn: '2 / -1' }}
        />
      </SettingsRow>
      <Box height={8} gridColumn='1 / -1' />
      <Box display='flex' alignItems='center' justifyContent='flex-end' gap={1}>
        {loading && <CircularProgress size={20} />}
        <Button
          size='small'
          variant='contained'
          onClick={!loading ? onSave : undefined}
          disabled={!hasData || locked}
        >
          Save
        </Button>
      </Box>
    </SettingsGrid>
  );
};
