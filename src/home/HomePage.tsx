import styled from 'styled-components';
import {
  HomeTitle,
  WallTalkerAd,
  ReleaseNotes,
  AgeWarning,
  Introduction,
  Instructions,
  VersionDisplay,
  StartButton,
} from './components';
import { SettingsSection } from '../settings';
import { HomeProvider } from './HomeProvider';

const StyledHomePage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  margin: 0;
  padding: 16px;

  & > * {
    max-width: 920px;
    width: 100%;
  }
`;

export const HomePage = () => {
  return (
    <HomeProvider>
      <StyledHomePage>
        <HomeTitle />
        <AgeWarning />
        <Introduction />
        <SettingsSection />
        <WallTalkerAd />
        <ReleaseNotes />
        <VersionDisplay />
        <Instructions />
        <StartButton />
      </StyledHomePage>
    </HomeProvider>
  );
};
