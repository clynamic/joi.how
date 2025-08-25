import styled from 'styled-components';

export type SpaceSize = 'smallest' | 'small' | 'medium' | 'large' | 'largest';

const spaceMap = {
  smallest: '4px',
  small: '8px',
  medium: '16px',
  large: '32px',
  largest: '64px',
};

export const Space = styled.div<{ size?: SpaceSize }>`
  grid-column: 1 / -1;
  width: ${({ size = 'small' }) => spaceMap[size]};
  height: ${({ size = 'small' }) => spaceMap[size]};
`;
