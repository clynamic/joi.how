import { useRef } from 'react';
import { Fields, SettingsDescription, Space } from '../../common';
import {
  WaButton,
  WaDetails,
  WaIcon,
  WaSwitch,
} from '@awesome.me/webawesome/dist/react';
import styled from 'styled-components';
import { useDispatchEvent } from '../../game/hooks/UseDispatchEvent';
import { useGameFrame } from '../../game/hooks/UseGameFrame';
import PluginInstaller, {
  InstallFailure,
} from '../../engine/plugins/PluginInstaller';
import type { PluginMeta } from '../../engine/plugins/Plugins';

const StyledPluginDetails = styled(WaDetails)<{ $enabled: boolean }>`
  --show-duration: 100ms;
  --hide-duration: 100ms;
  margin: var(--wa-space-2xs) 0;

  &::part(header) {
    opacity: ${p => (p.$enabled ? 1 : 0.3)};
    background: var(--wa-color-neutral-fill-quiet);
    transition:
      opacity var(--wa-transition-normal),
      background var(--wa-transition-normal);
    border-radius: var(--wa-border-radius-m);
    padding: var(--wa-space-s) var(--wa-space-s);
  }

  &::part(header):hover {
    background: var(--wa-color-brand);
  }

  &::part(content) {
    padding: var(--wa-space-xs) var(--wa-space-s);
  }
`;

const StyledPluginActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--wa-space-xs);
`;

const StyledPluginFailure = styled.p`
  display: flex;
  align-items: center;
  gap: var(--wa-space-xs);
  margin: 0 0 var(--wa-space-xs);
  color: var(--wa-color-danger-60);
  font-size: 0.9rem;
`;

export const PluginSettings = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { inject } = useDispatchEvent();
  const rawInstalled = useGameFrame(['core', 'plugin_installer', 'installed']);
  const installed: string[] = Array.isArray(rawInstalled) ? rawInstalled : [];
  const rawDisabled = useGameFrame(['core', 'plugin_installer', 'disabled']);
  const disabled: string[] = Array.isArray(rawDisabled) ? rawDisabled : [];
  const meta: Record<string, PluginMeta> =
    useGameFrame(['core', 'plugin_installer', 'meta']) ?? {};
  const rawFailed = useGameFrame(['core', 'plugin_installer', 'failed']);
  const failed: InstallFailure[] = Array.isArray(rawFailed) ? rawFailed : [];

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const code = await file.text();
    inject(PluginInstaller.install(code));
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Fields label='Plugins'>
      <SettingsDescription>Add mods to your game.</SettingsDescription>
      <input
        ref={fileRef}
        type='file'
        accept='.js'
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      <WaButton variant='neutral' onClick={() => fileRef.current?.click()}>
        <WaIcon name='upload' slot='prefix' />
        <span>Load plugin</span>
      </WaButton>
      <Space size='small' />
      {failed.map((failure, index) => (
        <StyledPluginFailure key={`${failure.id ?? ''}-${index}`}>
          <WaIcon name='triangle-exclamation' />
          <span>
            {failure.id ? `${failure.id}: ` : ''}
            {failure.message}
          </span>
        </StyledPluginFailure>
      ))}
      {installed.map(id => {
        const m = meta[id];
        const isEnabled = !disabled.includes(id);

        return (
          <StyledPluginDetails key={id} appearance='plain' $enabled={isEnabled}>
            <h6 slot='summary'>
              {m?.name ?? id}
              {m?.version && ` v${m.version}`}
            </h6>
            <p className='caption'>{id}</p>
            {m?.description && <p className='caption'>{m.description}</p>}
            {m?.author && <p className='caption'>by {m.author}</p>}
            <StyledPluginActions>
              <div
                onClick={() =>
                  inject(
                    isEnabled
                      ? PluginInstaller.disable(id)
                      : PluginInstaller.enable(id)
                  )
                }
                style={{ cursor: 'pointer' }}
              >
                <WaSwitch
                  checked={isEnabled}
                  defaultChecked={isEnabled}
                  style={{ pointerEvents: 'none' }}
                />
              </div>
              <WaButton
                size='small'
                variant='neutral'
                onClick={() => inject(PluginInstaller.remove(id))}
              >
                <WaIcon name='trash' />
              </WaButton>
            </StyledPluginActions>
          </StyledPluginDetails>
        );
      })}
      {installed.length === 0 && (
        <p className='caption'>No plugins installed</p>
      )}
    </Fields>
  );
};
