import { useRef, useState } from 'react';
import {
  Fields,
  JoiToggleTile,
  SettingsDescription,
  Space,
} from '../../common';
import { WaButton, WaIcon, WaSwitch } from '@awesome.me/webawesome/dist/react';
import styled from 'styled-components';
import { useDispatchEvent } from '../../game/hooks/UseDispatchEvent';
import { useGameFrame } from '../../game/hooks/UseGameFrame';
import PluginInstaller from '../../engine/plugins/PluginInstaller';
import type { PluginMeta } from '../../engine/plugins/Plugins';

const StyledPluginBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--wa-space-xs);
  padding: var(--wa-space-xs) var(--wa-space-s);
`;

const StyledPluginActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--wa-space-xs);
`;

export const PluginSettings = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { inject } = useDispatchEvent();
  const [expanded, setExpanded] = useState<string | null>(null);
  const rawInstalled = useGameFrame(['core', 'plugin_installer', 'installed']);
  const installed: string[] = Array.isArray(rawInstalled) ? rawInstalled : [];
  const rawDisabled = useGameFrame(['core', 'plugin_installer', 'disabled']);
  const disabled: string[] = Array.isArray(rawDisabled) ? rawDisabled : [];
  const meta: Record<string, PluginMeta> =
    useGameFrame(['core', 'plugin_installer', 'meta']) ?? {};

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const code = await file.text();
    inject(PluginInstaller.install(code));
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Fields label='Plugins'>
      <SettingsDescription>
        Load plugins from JavaScript files.
      </SettingsDescription>
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
      {installed.map(id => {
        const m = meta[id];
        const isEnabled = !disabled.includes(id);
        const isExpanded = expanded === id;

        return (
          <div key={id}>
            <JoiToggleTile
              value={isEnabled}
              onClick={() => setExpanded(isExpanded ? null : id)}
              type='none'
            >
              <h6 className='subtitle'>
                {m?.name ?? id}
                {m?.version && ` v${m.version}`}
              </h6>
            </JoiToggleTile>
            {isExpanded && (
              <StyledPluginBody>
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
              </StyledPluginBody>
            )}
          </div>
        );
      })}
      {installed.length === 0 && (
        <p className='caption'>No plugins installed</p>
      )}
    </Fields>
  );
};
