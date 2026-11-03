import styled from 'styled-components';

export const ContentSection = styled.section`
  background: var(--card-background);
  color: var(--card-color);

  border-radius: var(--border-radius);

  width: 100%;
  margin-bottom: 14px;
  padding: 10px 15px;

  @media (max-width: 600px) {
    padding: var(--wa-space-2xs) var(--wa-space-xs);
    margin-bottom: var(--wa-space-xs);
  }

  font-size: 0.9rem;
  line-height: 25px;
  font-weight: normal;
  color: #d3cedc;
`;
