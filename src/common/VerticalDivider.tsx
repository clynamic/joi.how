import styled from 'styled-components';

export const VerticalDivider = styled.div`
  margin: auto 10px;

  align-self: center;
  width: 1px;
  height: 25px;

  &::after {
    display: block;
    content: '';

    background: currentColor;

    width: 100%;
    height: 100%;
  }
`;
