import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { WaButton } from '@awesome.me/webawesome/dist/react';
import { ContentSection } from '../common';
import { useGameEngine } from '../game/hooks/UseGameEngine';
import { useGameState } from '../game/hooks';
import Clock from '../game/plugins/clock';
import Rand from '../game/plugins/rand';
import { formatTime } from '../utils';
import { ClimaxResult } from './ClimaxResult';
import { GameTimeline } from './GameTimeline';

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const StyledEndPage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--wa-space-l);

  min-height: 100%;
  width: 100%;
  padding: 16px;

  & > * {
    max-width: 480px;
    width: 100%;
    animation: ${fadeInUp} 500ms cubic-bezier(0.23, 1, 0.32, 1) both;
  }

  & > :nth-child(1) { animation-delay: 100ms; }
  & > :nth-child(2) { animation-delay: 250ms; }
  & > :nth-child(3) { animation-delay: 400ms; }
`;

const StyledTitle = styled.h1`
  text-align: center;
  font-size: clamp(2rem, 8vw, 3.5rem);
  font-weight: bold;
  line-height: 1;
`;

const StyledCard = styled(ContentSection)`
  display: flex;
  flex-direction: column;
  gap: var(--wa-space-m);
  padding: 20px;
`;

const StyledStatsRow = styled.div`
  display: flex;
  justify-content: space-around;
`;

const StyledStat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

const StyledStatValue = styled.span`
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--text-color);
`;

const StyledStatLabel = styled.span`
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.4;
`;

const StyledDivider = styled.hr`
  border: none;
  border-top: 1px solid currentColor;
  width: 100%;
  margin: 0;
`;

const StyledActions = styled.div`
  display: flex;
  justify-content: center;
`;

const StyledFinishButton = styled(WaButton)`
  &::part(base) {
    height: fit-content;
    padding: 12px 40px;
  }

  &::part(label) {
    font-size: 1.25rem;
    text-transform: uppercase;
  }
`;

export const EndPage = () => {
  const { state } = useGameEngine();
  const navigate = useNavigate();
  const clockState = useGameState(Clock.paths.state) as { elapsed?: number } | undefined;
  const randState = useGameState(Rand.paths.state) as { seed?: string } | undefined;

  useEffect(() => {
    if (!state) navigate('/');
  }, [state, navigate]);

  if (!state) return null;

  const displayTime = typeof clockState?.elapsed === 'number' ? clockState.elapsed : 0;
  const seed = randState?.seed ?? '';

  return (
    <StyledEndPage>
      <StyledTitle>Game Over</StyledTitle>
      <StyledCard>
        <ClimaxResult />
        <StyledDivider />
        <StyledStatsRow>
          <StyledStat>
            <StyledStatValue>{formatTime(displayTime)}</StyledStatValue>
            <StyledStatLabel>Play time</StyledStatLabel>
          </StyledStat>
          <StyledStat>
            <StyledStatValue style={{ fontFamily: 'monospace', fontSize: '1rem' }}>{seed}</StyledStatValue>
            <StyledStatLabel>Seed</StyledStatLabel>
          </StyledStat>
        </StyledStatsRow>
        <StyledDivider />
        <GameTimeline />
      </StyledCard>
      <StyledActions>
        <StyledFinishButton size='large' onClick={() => navigate('/')}>
          Finish
        </StyledFinishButton>
      </StyledActions>
    </StyledEndPage>
  );
};
