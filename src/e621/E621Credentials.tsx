import styled from 'styled-components';
import { E621Service } from './E621Service';
import { useCallback, useState } from 'react';
import {
  SettingsDescription,
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
  background: var(--focus-color);
  color: var(--text-color);
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

  return (
    <StyledE621CredentialsInput>
      <SettingsDescription>
        Access your API key from{' '}
        <a href='https://e621.net/users/home' target='_blank' rel='noreferrer'>
          your profile
        </a>
        .
      </SettingsDescription>
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
        disabled={loading}
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
        disabled={loading}
      />
      <Space size='small' />
      <StyledE621SaveCredentials>
        {loading && <Spinner />}
        <Space size='small' />
        <StyledE621SaveCredentialsButton
          onClick={!loading ? onSave : undefined}
          disabled={!input.username || !input.apiKey || loading || !onSaved}
        >
          Save
        </StyledE621SaveCredentialsButton>
      </StyledE621SaveCredentials>
    </StyledE621CredentialsInput>
  );
};
