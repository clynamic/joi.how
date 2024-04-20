import styled from 'styled-components';
import { ContentSection } from '../home/components';
import {
  DurationSettings,
  EventSettings,
  PaceSettings,
  SettingsTile,
} from './components';

const StyledSettingsSection = styled(ContentSection)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
`;

export const SettingsSection = () => {
  return (
    <StyledSettingsSection>
      <PaceSettings />
      <DurationSettings />
      <EventSettings />
      <SettingsTile label='Images'>
        lorem ipsum dolor sit amet consectetur adipisicing elit
      </SettingsTile>
      <SettingsTile label='Walltalker'>
        lorem ipsum dolor sit amet consectetur adipisicing elit
      </SettingsTile>
      <SettingsTile label='Climax'>
        lorem ipsum dolor sit amet consectetur adipisicing elit
      </SettingsTile>
      <SettingsTile label='Hypno'>
        lorem ipsum dolor sit amet consectetur adipisicing elit
      </SettingsTile>
      <SettingsTile label='Player'>
        lorem ipsum dolor sit amet consectetur adipisicing elit
      </SettingsTile>
      <SettingsTile label='Integration'>
        lorem ipsum dolor sit amet consectetur adipisicing elit
      </SettingsTile>
      <SettingsTile label='Save/Load'>
        lorem ipsum dolor sit amet consectetur adipisicing elit
      </SettingsTile>
    </StyledSettingsSection>
  );
};
