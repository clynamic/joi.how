import { PropsWithChildren } from 'react';
import {
  Card,
  CardActionArea,
  Stack,
  Checkbox,
  Radio,
  useTheme,
  Box,
  Typography,
  ThemeProvider,
} from '@mui/material';

// eslint-disable-next-line react-refresh/only-export-components
export enum ToggleTileType {
  none = 'none',
  check = 'check',
  radio = 'radio',
}

export interface ToggleTileProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: boolean;
  onClick?: () => void;
  type?: ToggleTileType;
  trailing?: React.ReactNode;
}

export const ToggleCard: React.FC<PropsWithChildren<ToggleTileProps>> = ({
  children,
  value = true,
  onClick,
  type = ToggleTileType.none,
  trailing,
  ...props
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        opacity: value ? 1 : 0.3,
        transition: 'opacity 0.2s, background 0.2s',
        margin: '6px 0',
        background: 'var(--button-background)',
        boxShadow: 'none',
      }}
      {...props}
    >
      <CardActionArea onClick={onClick}>
        <Stack
          direction='row'
          spacing={1}
          alignItems='center'
          justifyContent='space-between'
        >
          <Box sx={{ padding: '4px 8px' }}>
            <ThemeProvider
              theme={{
                ...theme,
                typography: {
                  ...theme.typography,
                  subtitle2: {
                    ...theme.typography.subtitle2,
                    fontWeight: 'bold',
                    color: theme.palette.text.primary,
                  },
                },
              }}
            >
              {children}
            </ThemeProvider>
          </Box>
          <Typography variant='h5' color='text.primary'>
            {trailing ? (
              <Box
                sx={{
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {trailing}
              </Box>
            ) : type === ToggleTileType.check ? (
              <Checkbox
                checked={value}
                disableRipple={true}
                sx={{
                  '&.Mui-checked': {
                    color: theme.palette.text.primary,
                  },
                }}
              />
            ) : type === ToggleTileType.radio ? (
              <Radio
                checked={value}
                disableRipple
                sx={{
                  '&.Mui-checked': {
                    color: theme.palette.text.primary,
                  },
                }}
              />
            ) : null}
          </Typography>
        </Stack>
      </CardActionArea>
    </Card>
  );
};
