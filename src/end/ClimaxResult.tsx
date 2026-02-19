import styled from 'styled-components';
import { useGameFrame } from '../game/hooks';
import { climax, type ClimaxResultType } from '../game/plugins/dice/climax';

type OutcomeDisplay = { label: string; description: string };

const outcomes: Record<NonNullable<ClimaxResultType>, OutcomeDisplay> = {
  climax: { label: 'Climax', description: 'You came' },
  denied: { label: 'Denied', description: 'Better luck next time' },
  ruined: { label: 'Ruined', description: 'How unfortunate' },
};

const earlyEnd: OutcomeDisplay = { label: 'Ended early', description: '' };

const StyledResult = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StyledLabel = styled.span`
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--text-color);
`;

const StyledDescription = styled.span`
  font-size: 0.85rem;
  opacity: 0.6;
`;

export const ClimaxResult = () => {
  const result = useGameFrame(climax.result) as ClimaxResultType;
  const display = (result && outcomes[result]) || earlyEnd;

  return (
    <StyledResult>
      <StyledLabel>{display.label}</StyledLabel>
      {display.description && (
        <StyledDescription>{display.description}</StyledDescription>
      )}
    </StyledResult>
  );
};
