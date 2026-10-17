import styled from 'styled-components';
import { ContentSection } from '../../common';
import { useImages } from '../../settings';
import { useNavigate } from 'react-router-dom';
import { WaButton } from '@awesome.me/webawesome/dist/react';
import { useGameFrame } from '../../game/hooks/UseGameFrame';
import { useDispatchEvent } from '../../game/hooks/UseDispatchEvent';
import Saves, { Restored } from '../../game/plugins/saves';

const StyledStartSection = styled(ContentSection)`
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
`;

const StyledStartWarning = styled.p`
  text-align: center;
  margin-bottom: 1rem;
`;

const StyledStartButton = styled(WaButton)`
  &::part(base) {
    height: fit-content;
    padding: 15px 20px;
  }

  &::part(label) {
    font-size: 1.5rem;
    text-transform: uppercase;
  }
`;

const StyledRow = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
`;

const StyledAside = styled.div`
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 1rem;
  white-space: nowrap;
`;

const StyledSavedAt = styled.p`
  margin: 0;
  opacity: 0.7;
  font-size: 0.9rem;
`;

function savedAgo(savedAt: number): string {
  const minutes = Math.round((Date.now() - savedAt) / 60000);
  if (minutes < 1) return 'saved just now';
  if (minutes < 60) return `saved ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `saved ${hours} h ago`;
  return `saved ${Math.round(hours / 24)} days ago`;
}

export const StartButton = () => {
  const [images] = useImages();
  const navigate = useNavigate();
  const { inject } = useDispatchEvent();
  const { restored = null } = useGameFrame(Saves.paths) as {
    restored?: Restored | null;
  };

  return (
    <StyledStartSection>
      {images.length === 0 && (
        <StyledStartWarning>
          Lets add some images before we start!
        </StyledStartWarning>
      )}
      <StyledRow>
        <StyledStartButton
          disabled={images.length === 0}
          onClick={() => navigate('/play')}
        >
          {restored ? 'continue' : 'begin'}
        </StyledStartButton>
        {restored && (
          <StyledAside>
            <WaButton
              size='small'
              appearance='plain'
              onClick={() => {
                inject(Saves.fresh(restored.slot));
                navigate('/play');
              }}
            >
              New game
            </WaButton>
          </StyledAside>
        )}
      </StyledRow>
      {restored && <StyledSavedAt>{savedAgo(restored.savedAt)}</StyledSavedAt>}
    </StyledStartSection>
  );
};
