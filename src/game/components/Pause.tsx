import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faPlay } from '@fortawesome/free-solid-svg-icons';
import { useGameEngine } from '../GameProvider';

const PauseContainer = styled.div`
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 9999;
`;

const PauseIconButton = styled.button`
  display: flex;
  align-items: center;
  padding: 16px 12px;
  gap: 8px;
  border-radius: var(--border-radius) 0 0 0;
  opacity: 0.8;
  background: #a52727;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: filter 0.2s;

  &:hover {
    filter: brightness(1.4);
  }
`;

export const PauseButton = () => {
  const { pause, resume, isRunning } = useGameEngine();
  const [paused, setPaused] = useState(!isRunning);

  useEffect(() => {
    setPaused(!isRunning);
  }, [isRunning]);

  const togglePause = () => {
    if (paused) {
      resume();
    } else {
      pause();
    }
    setPaused(!paused);
  };

  return (
    <PauseContainer>
      <PauseIconButton
        onClick={togglePause}
        title={paused ? 'Resume' : 'Pause'}
      >
        <p>{paused ? 'Resume' : 'Pause'}</p>
        <FontAwesomeIcon
          style={{ fontSize: 'var(--icon-size)' }}
          icon={paused ? faPlay : faPause}
        />
      </PauseIconButton>
    </PauseContainer>
  );
};
