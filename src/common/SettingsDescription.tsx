import { PropsWithChildren } from 'react';
import styled from 'styled-components';

const StyledDescription = styled.em`
  color: #9495ad; // TODO: Use CSS variable
  font-size: 0.8rem;

  line-height: 1.1;

  grid-column: 1 / -1;
  margin: 10px 0px;

  display: inline-flex;
  align-items: center;
`;

export const SettingsDescription: React.FC<PropsWithChildren> = ({
  children,
}) => {
  return <StyledDescription>{children}</StyledDescription>;
};
