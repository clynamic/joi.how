import styled from 'styled-components';

const StyledSettingsDivider = styled.hr`
  width: 24px;
  margin: 1rem auto;
  grid-column: 1 / -1;
  border: none;
  border-top: 1px solid currentColor;
  background: none;
`;

export const SettingsDivider = () => {
  return <StyledSettingsDivider />;
};
