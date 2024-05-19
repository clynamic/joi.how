import styled from 'styled-components';

export interface SettingsDescriptionProps
  extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

const StyledSettingsInfo = styled.em`
  color: #9495ad; // TODO: Use CSS variable
  font-size: 0.8rem;

  line-height: 1.1;

  grid-column: 1 / -1;
  margin: 10px 0px;

  align-items: center;
`;

export const SettingsInfo: React.FC<SettingsDescriptionProps> = ({
  children,
  ...props
}) => {
  return <StyledSettingsInfo {...props}>{children}</StyledSettingsInfo>;
};
