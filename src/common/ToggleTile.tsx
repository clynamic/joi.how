import { PropsWithChildren } from 'react';
import styled from 'styled-components';

interface StyledToggleTileProps {
  $enabled: boolean;
}

const StyledToggleTile = styled.button<StyledToggleTileProps>`
  grid-column: 1 / -1;
  width: 100%;

  display: flex;
  flex-direction: column;

  align-items: start;
  text-align: start;

  background: var(--focus-color);
  color: var(--text-color);

  border-radius: var(--border-radius);

  opacity: ${({ $enabled }) => ($enabled ? 1 : 0.3)};
  transition:
    opacity 0.2s,
    background 0.2s;

  &:hover {
    background: var(--primary);
  }

  border: unset;

  margin: 10px 0;
  padding: 5px 10px;

  cursor: pointer;

  strong {
    color: var(--text-color);
    margin-bottom: 2px;
  }

  p {
    color: var(--section-text);
  }
`;

export interface ToggleTileProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  enabled: boolean;
  onClick: () => void;
}

export const ToggleTile: React.FC<PropsWithChildren<ToggleTileProps>> = ({
  children,
  enabled,
  onClick,
  ...props
}) => {
  return (
    <StyledToggleTile
      $enabled={enabled}
      role='switch'
      aria-checked={enabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </StyledToggleTile>
  );
};
