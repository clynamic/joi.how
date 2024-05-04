import styled from 'styled-components';
import { ContentSection } from '../../common';
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

const StyledStartButton = styled.button`
  background: var(--focus-color);
  color: var(--text-color);

  border-radius: var(--border-radius);
  transition: var(--hover-transition);

  font-size: 1.5rem;
  cursor: pointer;
  padding: 15px 20px;

  &:hover {
    background: var(--primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
        BEGIN
      </StyledStartButton>
    </StyledStartSection>
  );
};
