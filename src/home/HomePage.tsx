import React from 'react';
import { Box } from '@mui/material';
import {
  AppTitle,
  WallTakerAd,
  ReleaseNotes,
  AgeWarning,
  Introduction,
  Instructions,
  VersionDisplay,
  StartButton,
} from './components';
import { SettingsSection } from '../settings';
import { HomeProvider } from './HomeProvider';

export const HomePage: React.FC = () => {
  return (
    <Box
      component='main'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: 0,
        padding: 2,

        '& > *': {
          maxWidth: 920,
          width: '100%',
        },
      }}
    >
      <HomeProvider>
        <AppTitle />
        <AgeWarning />
        <Introduction />
        <SettingsSection />
        <WallTakerAd />
        <VersionDisplay />
        <ReleaseNotes />
        <Instructions />
        <StartButton />
      </HomeProvider>
    </Box>
  );
};
