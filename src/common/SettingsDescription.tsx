import { ReactNode } from 'react';
import { Typography, TypographyProps } from '@mui/material';

export interface SettingsDescriptionProps
  extends TypographyProps<'p', { component?: 'p' }> {
  children: ReactNode;
}

export const SettingsDescription: React.FC<SettingsDescriptionProps> = ({
  children,
  ...props
}) => {
  return (
    <Typography
      component='p'
      lineHeight={1.1}
      sx={{
        margin: '10px 0',
      }}
      {...props}
    >
      {children}
    </Typography>
  );
};
