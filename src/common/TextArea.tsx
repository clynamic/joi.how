import styled from 'styled-components';

const StyledTextArea = styled.textarea`
  background: var(--background);
  color: var(--text-color);

  padding: 4px;

  font-size: 1rem;

  border: 1px solid var(--primary);
  border-radius: var(--border-radius);

  transition: var(--hover-transition);

  &:hover,
  &:focus {
    outline: none;
    filter: var(--hover-filter);
  }

  grid-column: 1 / -1;

  width: 100%;
  height: fit-content;
`;

export interface TextAreaProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    'value' | 'onChange'
  > {
  value?: string;
  onChange: (value: string) => void;
}

export const TextArea: React.FC<TextAreaProps> = ({
  value,
  onChange,
  ...props
}) => {
  return (
    <StyledTextArea
      value={value}
      onChange={e => onChange(e.target.value)}
      {...props}
    />
  );
};
