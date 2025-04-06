import { Card, SxProps, Theme } from '@mui/material';
import { PropsWithChildren } from 'react';

export const Section: React.FC<
  PropsWithChildren<{
    sx?: SxProps<Theme>;
  }>
> = ({ children, sx }) => {
  return (
    <Card
      component='section'
      sx={{
        width: '100%',
        padding: '12px 16px',
        marginBottom: '16px',
        color: 'var(--card-color)',
        ...sx,
      }}
    >
      {children}
    </Card>
  );
};
