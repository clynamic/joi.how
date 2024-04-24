import { PropsWithChildren } from 'react';
import styled from 'styled-components';

export interface TrailingProps extends PropsWithChildren {
  trailing: React.ReactNode;
}

const StyledNonTrailing = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const StyledTrailing = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  grid-column: 1 / -1;
`;

export const Trailing = ({ children, trailing }: TrailingProps) => {
  return (
    <StyledTrailing>
      <StyledNonTrailing>{children}</StyledNonTrailing>
      {trailing}
    </StyledTrailing>
  );
};
