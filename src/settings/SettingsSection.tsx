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
import { Section } from '../common';

export const SettingsSection = () => {
  return (
    <Section
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
      }}
    >
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
    </Section>
  );
};
