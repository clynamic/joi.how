import styled from 'styled-components';
import {
  ClimaxSettings,
  DurationSettings,
  EventSettings,
  HypnoSettings,
  PaceSettings,
  PlayerSettings,
  PluginSettings,
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
  gap: var(--wa-space-m);

  @media (max-width: 600px) {
    gap: var(--wa-space-xs);
  }
`;

export const SettingsSection = () => {
  return (
    <StyledSettingsSection>
      <PaceSettings />
      <DurationSettings />
      <PlayerSettings />
      <EventSettings />
      <HypnoSettings />
      <ClimaxSettings />
      <BoardSettings />
      <ServiceSettings />
      <ImageSettings />
      <VibratorSettings />
      <TradeSettings />
      <PluginSettings />
    </StyledSettingsSection>
  );
};
