import styled from 'styled-components';
import { Dialog, IconButton, VerticalDivider } from '../../common';
import { faCog, faCompress, faExpand } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCallback, useState } from 'react';
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
import { GamePhase, useGameValue, useSendMessage } from '../GameProvider';
import { useFullscreen, useLooping } from '../../utils';

const StyledGameSettings = styled.div`
  display: flex;
  height: fit-content;

  align-items: center;
  justify-content: center;

  border-radius: 0 var(--border-radius) 0 0;
  background: var(--overlay-background);
  color: var(--overlay-color);

  padding: 8px;
`;

interface GameSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StyledGameSettingsDialog = styled.div`
  overflow: auto;
  max-width: 920px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 400px), 1fr));
`;

const GameSettingsDialog: React.FC<GameSettingsDialogProps> = props => {
  return (
    <Dialog
      dismissable
      {...props}
      title={'Game Settings'}
      content={
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
      }
    />
  );
};

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
      <IconButton
        aria-label='Settings'
        onClick={() => onOpen(true)}
        icon={<FontAwesomeIcon icon={faCog} />}
      />
      <VerticalDivider color='rgba(255, 255, 255, 0.3)' />
      <IconButton
        aria-label='Fullscreen'
        onClick={() => setFullscreen(fullscreen => !fullscreen)}
        icon={<FontAwesomeIcon icon={fullscreen ? faCompress : faExpand} />}
      />
      <GameSettingsDialog open={open} onOpenChange={onOpen} />
    </StyledGameSettings>
  );
};
