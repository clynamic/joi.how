import { E621Service } from './E621Service';
import { useCallback, useMemo, useState } from 'react';
import {
  JoiStack,
  SettingsGrid,
  SettingsLabel,
  SettingsRow,
  Space,
} from '../common';
import { E621Credentials } from './E621Provider';
import { WaButton, WaIcon, WaInput } from '@awesome.me/webawesome/dist/react';

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
  const [input, setInput] = useState<E621Credentials>({
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
    <SettingsGrid>
      <Space size='small' />
      <SettingsRow>
        <SettingsLabel>Username</SettingsLabel>
        <WaInput
          className='joi-wide'
          value={input?.username}
          onInput={e =>
            setInput({
              ...input,
              username: e.currentTarget.value || '',
            })
          }
          placeholder='e.g. eggplant_enjoyer'
          autocomplete='username'
          disabled={locked}
        />
      </SettingsRow>
      <Space size='small' />
      <SettingsRow>
        <SettingsLabel>API Key</SettingsLabel>
        <WaInput
          className='joi-wide'
          value={input?.apiKey}
          onInput={e =>
            setInput({
              ...input,
              apiKey: e.currentTarget.value || '',
            })
          }
          placeholder='pws gimmi ur keys :3'
          type='password'
          autocomplete='current-password'
          disabled={locked}
        >
          <p slot='hint'>
            Access your API key{' '}
            <a
              href='https://e621.net/users/you/api_key'
              target='_blank'
              rel='noreferrer'
            >
              here
            </a>
            .
          </p>
        </WaInput>
      </SettingsRow>
      <Space size='medium' />
      <JoiStack direction='row' justifyContent='flex-end'>
        <WaButton
          onClick={onSave}
          disabled={!hasData}
          loading={loading}
          size='small'
        >
          <span>Save</span>
          <WaIcon slot='end' name='save' />
        </WaButton>
      </JoiStack>
      <Space size='small' />
    </SettingsGrid>
  );
};
