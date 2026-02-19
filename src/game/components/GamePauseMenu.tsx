import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { WaButton, WaDialog, WaIcon } from '@awesome.me/webawesome/dist/react';
import { nestedDialogProps, useFullscreen } from '../../utils';
import { useGameFrame } from '../hooks';
import { useDispatchEvent } from '../hooks/UseDispatchEvent';
import Pause from '../plugins/pause';

const StyledTrigger = styled.div`
  display: flex;
  height: fit-content;
  align-items: center;
  justify-content: center;
  border-radius: 0 var(--border-radius) 0 0;
  background: var(--overlay-background);
  color: var(--overlay-color);
  padding: var(--wa-space-2xs);
`;

const StyledDialog = styled(WaDialog)`
  &::part(dialog) {
    background-color: transparent;
    box-shadow: none;
  }

  &::part(header) {
    justify-content: center;
  }

  &::part(title) {
    text-align: center;
  }

  &::part(close-button) {
    display: none;
  }

  &::part(body) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--wa-space-m);
    max-width: 300px;
    padding: var(--wa-space-l) 0;
    margin: 0 auto;
  }
`;

const StyledMenuButton = styled(WaButton)`
  &::part(base) {
    padding: var(--wa-space-l) var(--wa-space-2xl);
    background: var(--overlay-background);
    border-radius: var(--wa-form-control-border-radius);
    font-size: 1.25rem;
  }

  &::part(base):hover {
    background: var(--wa-color-brand);
  }
`;

export const GamePauseMenu = () => {
  const { paused, countdown } = useGameFrame(Pause.paths) ?? {};
  const [fullscreen, setFullscreen] = useFullscreen();
  const { inject } = useDispatchEvent();
  const navigate = useNavigate();
  const dialogRef = useRef<any>(null);

  const visible = !!paused && countdown == null;

  useEffect(() => {
    if (dialogRef.current) dialogRef.current.open = visible;
  }, [visible]);

  const onResume = useCallback(() => {
    inject(Pause.setPaused(false));
  }, [inject]);

  const onEndGame = useCallback(() => {
    navigate('/end');
  }, [navigate]);

  const onSettings = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const onPause = useCallback(() => {
    inject(Pause.setPaused(true));
  }, [inject]);

  return (
    <>
      <StyledTrigger>
        <WaButton aria-label='Menu' size='large' onClick={onPause}>
          <WaIcon name='bars' />
        </WaButton>
      </StyledTrigger>
      <StyledDialog
        ref={dialogRef}
        label='Paused'
        {...nestedDialogProps(() => {
          if (countdown != null) return;
          inject(Pause.setPaused(false));
        })}
      >
        <StyledMenuButton size='large' onClick={onResume}>
          <WaIcon slot='start' name='play' />
          <span>Resume</span>
        </StyledMenuButton>
        <StyledMenuButton size='large' onClick={() => setFullscreen(fs => !fs)}>
          <WaIcon slot='start' name={fullscreen ? 'compress' : 'expand'} />
          <span>{fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
        </StyledMenuButton>
        <StyledMenuButton size='large' onClick={onSettings}>
          <WaIcon slot='start' name='gear' />
          <span>Settings</span>
        </StyledMenuButton>
        <StyledMenuButton size='large' variant='danger' onClick={onEndGame}>
          <WaIcon slot='start' name='right-from-bracket' />
          <span>End Game</span>
        </StyledMenuButton>
      </StyledDialog>
    </>
  );
};
