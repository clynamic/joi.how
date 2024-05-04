import styled from 'styled-components';

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick: () => void;
}

export const StyledIconButton = styled.button`
  background: none;
  color: var(--text-color);

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
  children,
  onClick,
  ...rest
}) => {
  return (
    <StyledIconButton onClick={onClick} {...rest}>
      {children}
    </StyledIconButton>
  );
};
