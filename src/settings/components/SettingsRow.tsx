import { PropsWithChildren } from 'react';
import styled from 'styled-components';

const StyledSettingsRow = styled.div``;

export const SettingsRow: React.FC<PropsWithChildren> = ({ children }) => {
  return <StyledSettingsRow>{children}</StyledSettingsRow>;
};
