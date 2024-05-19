import styled from 'styled-components';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const StyledButton = styled.button`
  background: var(--button-background);
  color: var(--button-color);

  padding: 8px 16px;

  border-radius: var(--border-radius);
  cursor: pointer;

  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: var(--primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return <StyledButton {...props}>{children}</StyledButton>;
};
