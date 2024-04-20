import styled from 'styled-components';

export const Divider = styled.div`
  grid-column: 1 / -1;
  width: 100%;

  &::after {
    display: block;
    content: '';

    background: #595a77; // TODO: use css variable

    width: 25px;
    height: 1px;
    margin: 10px auto;
  }
`;
