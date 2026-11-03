import React, { PropsWithChildren } from 'react';
import styled from 'styled-components';

const StyledSettingsRow = styled.div<{ $gridColumn?: string }>`
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  grid-column: ${({ $gridColumn }) => $gridColumn || 'auto'};
`;

export const SettingsRow: React.FC<PropsWithChildren> = ({ children }) => {
  const items = React.Children.toArray(children);

  if (items.length > 3) {
    throw new Error('SettingsRow supports a maximum of 3 children.');
  }

  if (items.length === 1) {
    return (
      <StyledSettingsRow $gridColumn='1 / -1' data-settings-row='true'>
        {items[0]}
      </StyledSettingsRow>
    );
  }

  if (items.length === 2) {
    return (
      <>
        <StyledSettingsRow $gridColumn='1' data-settings-row='true'>
          {items[0]}
        </StyledSettingsRow>
        <StyledSettingsRow $gridColumn='2 / -1' data-settings-row='true'>
          {items[1]}
        </StyledSettingsRow>
      </>
    );
  }

  if (items.length === 3) {
    return (
      <>
        <StyledSettingsRow $gridColumn='1' data-settings-row='true'>
          {items[0]}
        </StyledSettingsRow>
        <StyledSettingsRow $gridColumn='2' data-settings-row='true'>
          {items[1]}
        </StyledSettingsRow>
        <StyledSettingsRow $gridColumn='3' data-settings-row='true'>
          {items[2]}
        </StyledSettingsRow>
      </>
    );
  }

  return null;
};
