import React from 'react';
import styled from 'styled-components';

export interface SettingsGridProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const StyledSettingsGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  column-gap: 1rem;

  & > :not([data-settings-row='true']) {
    grid-column: 1 / -1;
  }
`;

export const SettingsGrid: React.FC<SettingsGridProps> = ({
  children,
  ...props
}) => {
  return <StyledSettingsGrid {...props}>{children}</StyledSettingsGrid>;
};
