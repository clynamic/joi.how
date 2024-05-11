import { PropsWithChildren } from 'react';
import styled from 'styled-components';

export interface SurroundedProps extends PropsWithChildren {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

const StyledCenterSurrounded = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const StyledSurrounded = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  grid-column: 1 / -1;
`;

const StyledAround = styled.div`
  display: flex;
  align-items: center;
  font-size: var(--icon-size);
`;

export const Surrounded = ({
  children,
  leading,
  trailing,
}: SurroundedProps) => {
  return (
    <StyledSurrounded>
      {leading && <StyledAround>{leading}</StyledAround>}
      <StyledCenterSurrounded>{children}</StyledCenterSurrounded>
      {trailing && <StyledAround>{trailing}</StyledAround>}
    </StyledSurrounded>
  );
};
