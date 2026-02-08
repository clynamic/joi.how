import styled from 'styled-components';
import {
  HomeTitle,
  WallTakerAd,
  ReleaseNotes,
  AgeWarning,
  Introduction,
  Instructions,
  VersionDisplay,
  StartButton,
} from './components';
import { SettingsSection } from '../settings';
import { HypnoSettingsSection } from '../settings/hypno';
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
        <HypnoSettingsSection />
        <WallTakerAd />
        <VersionDisplay />
        <ReleaseNotes />
        <Instructions />
        <StartButton />
      </StyledHomePage>
    </HomeProvider>
  );
};
