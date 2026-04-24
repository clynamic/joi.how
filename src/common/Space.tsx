export type SpaceSize = 'smallest' | 'small' | 'medium' | 'large' | 'largest';

const spaceMap: Record<SpaceSize, string> = {
  smallest: 'var(--wa-space-2xs)', // 4px
  small: 'var(--wa-space-xs)', // 8px
  medium: 'var(--wa-space-m)', // 16px
  large: 'var(--wa-space-xl)', // 32px
  largest: 'var(--wa-space-4xl)', // 64px
};

export const Space = ({ size = 'small' }: { size?: SpaceSize }) => (
  <div
    style={{
      gridColumn: '1 / -1',
      width: spaceMap[size],
      height: spaceMap[size],
    }}
  />
);
