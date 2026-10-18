import styled from 'styled-components';
import { useGameFrame } from '../game/hooks';
import Scene from '../game/plugins/scene';
import {
  HomeTitle,
  ReleaseNotes,
  AgeWarning,
  Introduction,
  Instructions,
  VersionDisplay,
  StartButton,
} from './components';
import { SettingsSection } from '../settings';

const StyledHomePage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  margin: 0;
  padding: 16px;

  @media (max-width: 600px) {
    padding: 6px;
  }

  & > * {
    max-width: 920px;
    width: 100%;
  }
`;

export const HomePage = () => {
  const scene = useGameFrame<string | undefined>(Scene.paths.current);
  const ready = typeof scene === 'string' && scene !== 'boot';
  return (
    <StyledHomePage>
      <HomeTitle />
      {ready && (
        <>
          <AgeWarning />
          <Introduction />
          <SettingsSection />
          <VersionDisplay />
          <ReleaseNotes />
          <Instructions />
          <StartButton />
        </>
      )}
    </StyledHomePage>
  );
};
