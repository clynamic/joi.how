import { Box } from '@mui/material';

export type SpaceSize = 'smallest' | 'small' | 'medium' | 'large' | 'largest';

const spaceMap = {
  smallest: 0.5,
  small: 1,
  medium: 2,
  large: 4,
  largest: 8,
};

export const Space = ({ size = 'small' }: { size?: SpaceSize }) => (
  <Box
    sx={{
      gridColumn: '1 / -1',
      width: theme => theme.spacing(spaceMap[size]),
      height: theme => theme.spacing(spaceMap[size]),
    }}
  />
);
