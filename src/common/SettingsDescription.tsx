import { PropsWithChildren } from 'react';
import styled from 'styled-components';

const StyledSettingsDescription = styled.p`
  line-height: 1.1;

  grid-column: 1 / -1;
  margin: 10px 0px;
`;

export const SettingsDescription: React.FC<PropsWithChildren> = ({
  children,
}) => {
  return <StyledSettingsDescription>{children}</StyledSettingsDescription>;
};
