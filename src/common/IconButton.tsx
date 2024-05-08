import styled from 'styled-components';
import { Tooltip } from './Tooltip';

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  onClick?: () => void;
  tooltip?: string;
}

export const StyledIconButton = styled.button`
  background: none;
  color: var(--color-text);
  opacity: ${(props: { disabled?: boolean }) => (props.disabled ? 0.5 : 1)};

  border-radius: var(--border-radius);
  padding: 4px;

  font-size: var(--icon-size);

  height: 32px;
  width: 32px;

  transition: background 0.2s;

  &:hover {
    background: var(--focus-color);
  }

  &:enabled {
    cursor: pointer;
  }
  &:disabled {
    cursor: not-allowed;
  }
`;

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  tooltip,
  ...rest
}) => {
  return (
    <Tooltip content={tooltip}>
      <StyledIconButton disabled={onClick == null} onClick={onClick} {...rest}>
        {icon}
      </StyledIconButton>
    </Tooltip>
  );
};
