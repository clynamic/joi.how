import styled from 'styled-components';
import { useSetting } from '../../settings';
import { GameHypnoType } from '../../types';

const StyledGameHypno = styled.div`
  pointer-events: none;
`;

export const GameHypno = () => {
  const [hypno] = useSetting('hypno');

  if (hypno == GameHypnoType.off) {
    return null;
  }

  return (
    <StyledGameHypno>
      {
        // TODO: Implement hypno text
      }
    </StyledGameHypno>
  );
};
