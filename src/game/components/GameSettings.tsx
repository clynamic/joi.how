import styled from 'styled-components';
import { memo, useCallback, useRef, useState } from 'react';
import {
  BoardSettings,
  ClimaxSettings,
  DurationSettings,
  EventSettings,
  HypnoSettings,
  ImageSettings,
  PaceSettings,
  PlayerSettings,
  VibratorSettings,
} from '../../settings';
import { useFullscreen } from '../../utils';
import {
  WaButton,
  WaDialog,
  WaDivider,
  WaIcon,
} from '@awesome.me/webawesome/dist/react';
import { useGameState } from '../hooks';
import { useDispatchEvent } from '../hooks/UseDispatchEvent';
import Phase, { GamePhase } from '../plugins/phase';
import Pause from '../plugins/pause';

const StyledGameSettings = styled.div`
  display: flex;
  height: fit-content;

  align-items: center;
  justify-content: center;

  border-radius: 0 var(--border-radius) 0 0;
  background: var(--overlay-background);
  color: var(--overlay-color);

  padding: var(--wa-space-2xs);
`;

const StyledGameSettingsDialogWrapper = styled(WaDialog)`
  @media (max-width: 600px) {
    &::part(body) {
      padding: var(--wa-space-2xs);
    }
  }
`;

const StyledGameSettingsDialog = styled.div`
  overflow: auto;
  max-width: 920px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 400px), 1fr));
  gap: var(--wa-space-m);

  @media (max-width: 600px) {
    gap: var(--wa-space-xs);
  }
`;

const GameSettingsDialogContent = memo(() => (
  <StyledGameSettingsDialog>
    <PaceSettings />
    <DurationSettings />
    <PlayerSettings />
    <EventSettings />
    <HypnoSettings />
    <ClimaxSettings />
    <BoardSettings />
    <VibratorSettings />
    <ImageSettings />
  </StyledGameSettingsDialog>
));

export const GameSettings = () => {
  const [open, setOpen] = useState(false);
  const { current: phase } = useGameState(Phase.paths.state) ?? {};
  const [fullscreen, setFullscreen] = useFullscreen();
  const { inject } = useDispatchEvent();
  const wasActiveRef = useRef(false);

  const onOpen = useCallback(
    (opening: boolean) => {
      if (opening) {
        wasActiveRef.current = phase === GamePhase.active;
        if (phase === GamePhase.active) {
          inject(Pause.setPaused(true));
        }
      } else {
        if (wasActiveRef.current) {
          inject(Pause.setPaused(false));
        }
      }
      setOpen(opening);
    },
    [inject, phase]
  );

  return (
    <StyledGameSettings>
      <WaButton aria-label='Settings' size='large' onClick={() => onOpen(true)}>
        <WaIcon name='gear' />
      </WaButton>
      <WaDivider
        orientation='vertical'
        style={{
          '--spacing': 'var(--wa-space-xs)',
        }}
      />
      <WaButton
        aria-label='Fullscreen'
        size='large'
        onClick={() => setFullscreen(fullscreen => !fullscreen)}
      >
        <WaIcon name={fullscreen ? 'compress' : 'expand'} />
      </WaButton>
      <StyledGameSettingsDialogWrapper
        lightDismiss
        open={open}
        onWaHide={e => {
          if (
            e.target === e.currentTarget &&
            (e.currentTarget as HTMLElement)?.querySelector('wa-dialog[open]')
          )
            e.preventDefault();
        }}
        onWaAfterHide={e => {
          if (e.target !== e.currentTarget) return;
          onOpen(false);
        }}
        label={'Game Settings'}
        style={{
          '--width': '920px',
        }}
      >
        {open && <GameSettingsDialogContent />}
      </StyledGameSettingsDialogWrapper>
    </StyledGameSettings>
  );
};
