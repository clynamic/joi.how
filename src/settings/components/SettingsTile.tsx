import { PropsWithChildren } from 'react';
import styled from 'styled-components';

const StyledSettingsTile = styled.fieldset`
  background: rgba(122, 123, 163, 0.123);

  border: unset;
  border-left: 2px solid #595a77;

  margin: 15px;
  padding: 5px 15px;

  position: relative;
`;

const StyledSettingsLabel = styled.legend`
  width: fit-content;
  padding: 4px 8px;
  background: #595a77;
`;

export interface SettingsTileProps extends PropsWithChildren {
  label: React.ReactNode;
}

export const SettingsTile: React.FC<SettingsTileProps> = ({
  label,
  children,
}) => {
  return (
    <StyledSettingsTile>
      <StyledSettingsLabel>{label}</StyledSettingsLabel>
      {children}
    </StyledSettingsTile>
  );
};
