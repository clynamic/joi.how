import styled from 'styled-components';
import { Button, ContentSection } from '../../common';
import { useImages } from '../../settings';
import { useNavigate } from 'react-router-dom';

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

const StyledStartButton = styled(Button)`
  font-size: 1.5rem;
  padding: 15px 20px;
  text-transform: uppercase;
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
