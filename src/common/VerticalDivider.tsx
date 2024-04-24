import styled from 'styled-components';

export const VerticalDivider = styled.div`
  height: 100%;

  &::after {
    display: block;
    content: '';

    background: #595a77; // TODO: use css variable

    width: 1px;
    height: 25px;
    margin: auto 10px;
  }
`;
