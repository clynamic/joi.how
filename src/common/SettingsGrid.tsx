import { Box, SxProps, Theme } from '@mui/material';
import React from 'react';
import { PropsWithChildren } from 'react';

export const SettingsGrid: React.FC<
  PropsWithChildren<{
    sx?: SxProps<Theme>;
  }>
> = ({ children, sx }) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        columnGap: 2,

        [`& > :not(.${SettingsRow.name})`]: {
          gridColumn: '1 / -1',
        },

        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export const SettingsRow: React.FC<PropsWithChildren> = ({ children }) => {
  const items = React.Children.toArray(children);
  const className = SettingsRow.name;
  const sx: SxProps<Theme> = {
    display: 'flex',
    height: '100%',
    width: '100%',
    alignItems: 'center',
  };

  if (items.length > 3) {
    throw new Error(`${className} supports a maximum of 3 children.`);
  }

  if (items.length === 1) {
    return (
      <Box
        className={className}
        sx={{
          ...sx,
          gridColumn: '1 / -1',
        }}
      >
        {items[0]}
      </Box>
    );
  }

  if (items.length === 2) {
    return (
      <>
        <Box className={className} sx={{ ...sx, gridColumn: 1 }}>
          {items[0]}
        </Box>
        <Box className={className} sx={{ ...sx, gridColumn: '2 / -1' }}>
          {items[1]}
        </Box>
      </>
    );
  }

  if (items.length === 3) {
    return (
      <>
        <Box className={className} sx={{ ...sx, gridColumn: 1 }}>
          {items[0]}
        </Box>
        <Box className={className} sx={{ ...sx, gridColumn: 2 }}>
          {items[1]}
        </Box>
        <Box className={className} sx={{ ...sx, gridColumn: 3 }}>
          {items[2]}
        </Box>
      </>
    );
  }

  return null;
};
