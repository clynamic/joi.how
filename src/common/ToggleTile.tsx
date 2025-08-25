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
  $value: boolean;
}

const StyledToggleTile = styled.button<StyledToggleTileProps>`
  grid-column: 1 / -1;
  width: 100%;

  display: flex;
  flex-direction: column;

  align-items: start;
  text-align: start;

  background: var(--button-background);
  color: var(--button-color);

  border-radius: var(--border-radius);

  opacity: ${({ $value }) => ($value ? 1 : 0.3)};
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
    color: var(--card-color);
  }
`;

export enum ToggleTileType {
  none = 'none',
  check = 'check',
  radio = 'radio',
}

export interface ToggleTileProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  value?: boolean;
  onClick?: () => void;
  type?: ToggleTileType;
  trailing?: React.ReactNode;
}

export const ToggleTile: React.FC<PropsWithChildren<ToggleTileProps>> = ({
  children,
  value = true,
  onClick,
  type = ToggleTileType.none,
  trailing,
  ...props
}) => {
  return (
    <StyledToggleTile
      $value={value}
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
      aria-checked={value}
      onClick={onClick}
      {...props}
    >
      <Surrounded
        trailing={(() => {
          if (trailing) {
            return trailing;
          }
          switch (type) {
            case ToggleTileType.check:
              return (
                <FontAwesomeIcon icon={value ? faSquareCheck : faSquare} />
              );
            case ToggleTileType.radio:
              return <FontAwesomeIcon icon={value ? faCircleDot : faCircle} />;
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
