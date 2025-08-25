import styled from 'styled-components';

export const Divider = styled.div`
  grid-column: 1 / -1;
  width: 100%;

  &::after {
    display: block;
    content: '';

    background: currentColor;

    width: 25px;
    height: 1px;
    margin: 10px auto;
  }
`;
