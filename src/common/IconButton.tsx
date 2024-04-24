import styled from 'styled-components';

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick: () => void;
}

export const StyledIconButton = styled.button`
  background: none;
  color: var(--text-color);
  &:enabled {
    cursor: pointer;
  }
`;

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  onClick,
  ...rest
}) => {
  return (
    <StyledIconButton onClick={onClick} {...rest}>
      <h2>{children}</h2>
    </StyledIconButton>
  );
};
