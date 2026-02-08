import styled from 'styled-components';
import { useCallback, useState } from 'react';
import {
  BoardSettings,
  ClimaxSettings,
  DurationSettings,
  EventSettings,
  HypnoSettingsContent,
  ImageSettings,
  PaceSettings,
  PlayerSettings,
  VibratorSettings,
} from '../../settings';
import { GamePhase, useGameValue, useSendMessage } from '../GameProvider';
import { useFullscreen, useLooping } from '../../utils';
import {
  WaButton,
  WaDialog,
  WaDivider,
  WaIcon,
} from '@awesome.me/webawesome/dist/react';

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

const StyledGameSettingsDialog = styled.div`
  overflow: auto;
  max-width: 920px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 400px), 1fr));
`;

export const GameSettings = () => {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useGameValue('phase');
  const [timer, setTimer] = useState<number | undefined>(undefined);
  const [fullscreen, setFullscreen] = useFullscreen();
  const sendMessage = useSendMessage();
  const messageId = 'game-settings';

  const onOpen = useCallback(
    (open: boolean) => {
      if (open) {
        setTimer(undefined);
        setPhase(phase => {
          if (phase === GamePhase.active) {
            return GamePhase.pause;
          }
          return phase;
        });
      } else {
        setTimer(3000);
      }
      setOpen(open);
    },
    [setPhase]
  );

  useLooping(
    () => {
      if (timer === undefined) return;
      if (timer > 0) {
        sendMessage({
          id: messageId,
          title: 'Get ready to continue.',
          description: `${timer * 0.001}...`,
        });
        setTimer(timer - 1000);
      } else if (timer === 0) {
        sendMessage({
          id: messageId,
          title: 'Continue.',
          description: undefined,
          duration: 1500,
        });
        setPhase(GamePhase.active);
        setTimer(undefined);
      }
    },
    1000,
    !open && phase === GamePhase.pause && timer !== undefined
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
      <WaDialog
        lightDismiss
        open={open}
        onWaAfterHide={() => onOpen(false)}
        label={'Game Settings'}
        style={{
          '--width': '920px',
        }}
      >
        <StyledGameSettingsDialog>
          <PaceSettings />
          <DurationSettings />
          <PlayerSettings />
          <EventSettings />
          <ClimaxSettings />
          <BoardSettings />
          <VibratorSettings />
          <ImageSettings />
          <HypnoSettingsContent />
        </StyledGameSettingsDialog>
      </WaDialog>
    </StyledGameSettings>
  );
};
