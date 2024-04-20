import styled from 'styled-components';
import { ContentSection } from './ContentSection';

const StyledStartButton = styled.button`
  background: var(--focus-color);
  color: var(--text-color);

  border-radius: var(--border-radius);
  transition: var(--hover-transition);

  font-size: 1.5rem;
  cursor: pointer;
  padding: 15px 20px;

  &:hover {
    background: #595a77;
  }
`;

export const StartButton = () => {
  return (
    <ContentSection
      style={{
        background: 'transparent',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <StyledStartButton>BEGIN</StyledStartButton>
    </ContentSection>
  );
};
