import styled from 'styled-components';
import { useCallback, useMemo, useState } from 'react';
import { Button, SettingsLabel, Space, Spinner, TextInput } from '../common';
import { WalltakerService } from './WalltakerService';
import { WalltakerCredentials } from './WalltakerProvider';

export interface WalltakerCredentialsInputProps {
  service: WalltakerService;
  initialValue?: Partial<WalltakerCredentials>;
  onSaved?: (credentials: WalltakerCredentials) => void;
  disabled?: boolean;
}

const StyledE621CredentialsInput = styled.div`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: auto 1fr auto;
`;

const StyledE621SaveCredentials = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

export const WalltakerCredentialsInput = ({
  service,
  initialValue,
  onSaved,
  disabled,
}: WalltakerCredentialsInputProps) => {
  const [input, setInput] = useState<Partial<WalltakerCredentials>>({
    ...initialValue,
    username: '',
    apiKey: '',
  });
  const [loading, setLoading] = useState(false);

  const onSave = useCallback(async () => {
    const credentials = input as WalltakerCredentials;
    setLoading(true);
    const valid = await service.testCredentials(credentials);
    if (valid) {
      onSaved?.(credentials);
    }
  }, [input, onSaved, service]);

  const hasData = useMemo(
    () => input?.username && input?.apiKey,
    [input?.username, input?.apiKey]
  );

  const locked = useMemo(() => loading || disabled, [loading, disabled]);

  return (
    <StyledE621CredentialsInput>
      <Space size='small' />
      <SettingsLabel>Username</SettingsLabel>
      <TextInput
        name='walltaker-username'
        style={{ gridColumn: '2 / -1' }}
        value={input?.username}
        onChange={username =>
          setInput({
            ...input,
            username,
          })
        }
        placeholder='Username'
        autoComplete='username'
        disabled={locked}
      />
      <Space size='small' />
      <SettingsLabel>API Key</SettingsLabel>
      <TextInput
        name='walltaker-api-key'
        style={{ gridColumn: '2 / -1' }}
        value={input?.apiKey}
        onChange={apiKey =>
          setInput({
            ...input,
            apiKey,
          })
        }
        placeholder='API Key'
        type='password'
        autoComplete='current-password'
        disabled={locked}
      />
      <Space size='small' />
      <StyledE621SaveCredentials>
        {loading && <Spinner />}
        <Space size='small' />
        <Button
          onClick={!loading ? onSave : undefined}
          disabled={!hasData || locked}
        >
          Save
        </Button>
      </StyledE621SaveCredentials>
    </StyledE621CredentialsInput>
  );
};
