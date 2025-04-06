import React from 'react';
import { Card, Box } from '@mui/material';
import { SettingsGrid } from './SettingsGrid';
import { SxProps, Theme } from '@mui/system';

export interface SectionProps
  extends React.PropsWithChildren<React.HTMLAttributes<HTMLFieldSetElement>> {
  label?: React.ReactNode;
  sx?: SxProps<Theme>;
}

export const Fields: React.FC<SectionProps> = ({
  label,
  children,
  sx,
  ...props
}) => {
  return (
    <Card
      component={'fieldset'}
      variant='outlined'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--section-background)',
        color: 'var(--section-color)',
        border: 'none',
        borderLeft: '2px solid var(--legend-background)',
        borderRadius: 0,
        margin: '16px',
        padding: '6px 16px',
        ...sx,
      }}
      {...props}
    >
      {label && (
        <Box
          component='legend'
          sx={{
            padding: '4px 8px',
            backgroundColor: 'var(--legend-background)',
            color: 'var(--legend-color)',
            lineHeight: '100%',
            fontSize: '1rem',
          }}
        >
          {label}
        </Box>
      )}
      <SettingsGrid>{children}</SettingsGrid>
    </Card>
  );
};
