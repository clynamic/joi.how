import styled from 'styled-components';

const StyledAgeWarning = styled.div`
  width: 100%;
  font-size: 0.8rem;
  font-weight: normal;
  color: #9495ad;
  margin-bottom: 10px;
  background: var(--section-background);
`;

export const AgeWarning = () => {
  return (
    <StyledAgeWarning>
      <p>
        <em>
          This app is meant for adults only, and should not be used by anyone
          under the age of 18.
        </em>
      </p>
    </StyledAgeWarning>
  );
};
