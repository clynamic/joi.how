import styled from 'styled-components';
import { ContentSection } from '../home/components';
import {
  ClimaxSettings,
  DurationSettings,
  EventSettings,
  HypnoSettings,
  PaceSettings,
  PlayerSettings,
  ServiceSettings,
  ImageSettings,
  BoardSettings,
  VibratorSettings,
  TradeSettings,
} from './components';

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
      <ClimaxSettings />
      <BoardSettings />
      <ServiceSettings />
      <ImageSettings />
      <VibratorSettings />
      <TradeSettings />
    </StyledSettingsSection>
  );
};
