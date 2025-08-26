import styled from 'styled-components';
import { ContentSection } from '../../common';
import { useImages } from '../../settings';
import { useNavigate } from 'react-router-dom';
import { WaButton } from '@awesome.me/webawesome/dist/react';

const StyledStartSection = styled(ContentSection)`
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

export const StartButton = () => {
  const [images] = useImages();
  const navigate = useNavigate();

  return (
    <StyledStartSection>
      {images.length === 0 && (
        <StyledStartWarning>
          Lets add some images before we start!
        </StyledStartWarning>
      )}
      <StyledStartButton
        disabled={images.length === 0}
        onClick={() => navigate('/play')}
      >
        begin
      </StyledStartButton>
    </StyledStartSection>
  );
};
