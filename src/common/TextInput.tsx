import styled from 'styled-components';

const StyledTextInput = styled.input`
  background: var(--background);
  color: var(--text-color);

  padding: 4px;

  font-size: 1rem;

  border: 1px solid var(--primary);
  border-radius: var(--border-radius);

  transition: filter 0.2s;

  &:hover,
  &:focus {
    outline: none;
    filter: brightness(1.2);
  }

  grid-column: 1 / -1;

  width: 100%;
  height: fit-content;
`;

export interface TextInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type' | 'value' | 'onChange'
  > {
  type?: 'text' | 'password';
  value: string;
  onChange: (value: string) => void;
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  type = 'text',
  ...props
}) => {
  return (
    <StyledTextInput
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      {...props}
    />
  );
};
