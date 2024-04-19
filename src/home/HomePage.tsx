import styled from 'styled-components';
import { HomeTitle, WallTalkerAd } from './components';
import { ReleaseNotes } from './components/ReleaseNotes';
import { AgeWarning } from './components/AgeWarning';

const StyledHomePage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  margin: 0 0;

  & > * {
    max-width: 960px;
    width: 100%;
  }
`;

export const HomePage = () => {
  return (
    <StyledHomePage>
      <HomeTitle />
      <AgeWarning />
      <WallTalkerAd />
      <ReleaseNotes />
    </StyledHomePage>
  );
};
