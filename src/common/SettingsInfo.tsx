import { Typography, TypographyProps } from '@mui/material';
import { ReactNode } from 'react';

export interface SettingsDescriptionProps
  extends TypographyProps<'em', { component?: 'em' }> {
  children: ReactNode;
}

export const SettingsInfo: React.FC<SettingsDescriptionProps> = ({
  children,
  ...props
}) => {
  return (
    <Typography
      component='em'
      fontSize={'0.8rem'}
      lineHeight={1.1}
      sx={{
        color: '#9495ad', // TODO: Use CSS variable
        margin: '10px 0',
      }}
      {...props}
    >
      {children}
    </Typography>
  );
};
