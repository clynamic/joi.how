import { createElement } from 'react';
import styled from 'styled-components';
import { PLAYER_SETTINGS_TAG } from '../../game/player/settings';
import { DICE_SETTINGS_TAG } from '../../game/classic/dice/settings';
import { CLIMAX_SETTINGS_TAG } from '../../game/classic/dice/climaxSettings';
import { HYPNO_SETTINGS_TAG } from '../../game/classic/hypno/settings';
import { DURATION_SETTINGS_TAG } from '../../game/classic/setup/duration';
import { BOARD_SETTINGS_TAG } from '../../game/classic/setup/board';
import { PACE_SETTINGS_TAG } from '../../game/classic/setup/pace';
import { SOURCES_TAG } from '../../game/classic/setup/sources';
import { GALLERY_TAG } from '../../game/classic/images/gallery';
import { TOY_SETTINGS_TAG } from '../../game/toy/settings';
import { INSTALLER_SETTINGS_TAG } from '../../game/installer/settings';
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
      {createElement(PACE_SETTINGS_TAG)}
      {createElement(DURATION_SETTINGS_TAG)}
      {createElement(PLAYER_SETTINGS_TAG)}
      {createElement(DICE_SETTINGS_TAG)}
      {createElement(HYPNO_SETTINGS_TAG)}
      {createElement(CLIMAX_SETTINGS_TAG)}
      {createElement(BOARD_SETTINGS_TAG)}
      {createElement(SOURCES_TAG)}
      {createElement(GALLERY_TAG)}
      {createElement(TOY_SETTINGS_TAG)}
      {createElement(INSTALLER_SETTINGS_TAG)}
    </StyledSettingsSection>
  );
};
