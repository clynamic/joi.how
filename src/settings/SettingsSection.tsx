import styled from 'styled-components';
import {
  ClimaxSettings,
  DurationSettings,
  EventSettings,
  HypnoSettings,
  HypnoSpiralSettings,
  PaceSettings,
  PlayerSettings,
  ServiceSettings,
  ImageSettings,
  BoardSettings,
  VibratorSettings,
  TradeSettings,
} from './components';
import { ContentSection } from '../common';

const StyledSettingsSection = styled(ContentSection)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 400px), 1fr));
`;

export const SettingsSection = () => {
  return (
    <StyledSettingsSection>
      <PaceSettings />
      <DurationSettings />
      <PlayerSettings />
      <EventSettings />
      <HypnoSettings />
      <HypnoSpiralSettings />
      <ClimaxSettings />
      <BoardSettings />
      <ServiceSettings />
      <ImageSettings />
      <VibratorSettings />
      <TradeSettings />
    </StyledSettingsSection>
  );
};
