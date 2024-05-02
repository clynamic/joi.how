import styled, { CSSProperties } from 'styled-components';

export const VerticalDivider = styled.div<{
  color?: CSSProperties['backgroundColor'];
}>`
  height: 100%;
  margin: auto 10px;

  &::after {
    display: block;
    content: '';

    background: ${({ color }) => color ?? '#595a77'};

    width: 1px;
    height: 25px;
  }
`;
