import styled from 'styled-components';

export const SettingsDivider = styled.div`
  grid-column: 1 / -1;

  &::after {
    display: block;
    content: '';

    background: #595a77; // TODO: use css variable

    width: 25px;
    height: 1px;
    margin: 10px auto;
  }
`;
