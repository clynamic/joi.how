import styled from 'styled-components';

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps
  extends Omit<
    React.DetailedHTMLProps<
      React.SelectHTMLAttributes<HTMLSelectElement>,
      HTMLSelectElement
    >,
    'onChange'
  > {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
}

const StyledDropdown = styled.select`
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

  height: fit-content;
`;

const StyledOption = styled.option`
  background: var(--background);
  color: var(--text-color);
`;

export const Dropdown: React.FC<DropdownProps> = ({
  value,
  options,
  onChange,
  ...props
}) => {
  return (
    <StyledDropdown
      value={value}
      onChange={e => onChange(e.target.value)}
      {...props}
    >
      {options.map(option => (
        <StyledOption key={option.value} value={option.value}>
          {option.label}
        </StyledOption>
      ))}
    </StyledDropdown>
  );
};
