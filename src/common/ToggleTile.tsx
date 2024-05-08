/* eslint-disable react-refresh/only-export-components */
import { PropsWithChildren } from 'react';
import styled from 'styled-components';
import { Surrounded } from './Trailing';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircle,
  faCircleDot,
  faSquare,
  faSquareCheck,
} from '@fortawesome/free-regular-svg-icons';

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

export enum ToggleTileType {
  none = 'none',
  check = 'check',
  radio = 'radio',
}

export interface ToggleTileProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  enabled?: boolean;
  onClick?: () => void;
  type?: ToggleTileType;
}

export const ToggleTile: React.FC<PropsWithChildren<ToggleTileProps>> = ({
  children,
  enabled = true,
  onClick,
  type = ToggleTileType.none,
  ...props
}) => {
  return (
    <StyledToggleTile
      $enabled={enabled}
      role={(() => {
        switch (type) {
          case ToggleTileType.check:
            return 'checkbox';
          case ToggleTileType.radio:
            return 'radio';
          default:
            return 'switch';
        }
      })()}
      aria-checked={enabled}
      onClick={onClick}
      {...props}
    >
      <Surrounded
        trailing={(() => {
          switch (type) {
            case ToggleTileType.check:
              return (
                <FontAwesomeIcon icon={enabled ? faSquareCheck : faSquare} />
              );
            case ToggleTileType.radio:
              return (
                <FontAwesomeIcon icon={enabled ? faCircleDot : faCircle} />
              );
            default:
              return null;
          }
        })()}
      >
        {children}
      </Surrounded>
    </StyledToggleTile>
  );
};
