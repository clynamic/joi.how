import { PropsWithChildren } from 'react';
import styled from 'styled-components';

const StyledSettingsTitle = styled.p`
  line-height: 1.1;

  grid-column: 1 / -1;
  margin: 10px 0px;
`;

export const SettingsTitle: React.FC<PropsWithChildren> = ({ children }) => {
  return <StyledSettingsTitle>{children}</StyledSettingsTitle>;
};
