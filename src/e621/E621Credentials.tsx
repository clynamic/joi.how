import styled from 'styled-components';
import { E621Service } from './E621Service';
import { useCallback, useMemo, useState } from 'react';
import {
  SettingsInfo,
  SettingsLabel,
  Space,
  Spinner,
  TextInput,
} from '../common';
import { E621Credentials } from './E621Provider';

export interface E621CredentialsInputProps {
  service: E621Service;
  initialValue?: Partial<E621Credentials>;
  onSaved?: (credentials: E621Credentials) => void;
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

const StyledE621SaveCredentialsButton = styled.button`
  background: var(--button-background);
  color: var(--button-color);
  border-radius: var(--border-radius);
  padding: 4px 8px;
  transition:
    background 0.2s,
    opacity 0.2s;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  &:hover {
    background: var(--primary);
  }
  opacity: ${props => (props.disabled ? 0.5 : 1)};
`;

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
  }, [input, onSaved, service]);

  const hasData = useMemo(
    () => input?.username && input?.apiKey,
    [input?.username, input?.apiKey]
  );

  const locked = useMemo(() => loading || disabled, [loading, disabled]);

  return (
    <StyledE621CredentialsInput>
      <SettingsInfo>
        Access your API key from{' '}
        <a href='https://e621.net/users/home' target='_blank' rel='noreferrer'>
          your profile
        </a>
        .
      </SettingsInfo>
      <Space size='small' />
      <SettingsLabel>Username</SettingsLabel>
      <TextInput
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
        <StyledE621SaveCredentialsButton
          onClick={!loading ? onSave : undefined}
          disabled={!hasData || locked}
        >
          Save
        </StyledE621SaveCredentialsButton>
      </StyledE621SaveCredentials>
    </StyledE621CredentialsInput>
  );
};
