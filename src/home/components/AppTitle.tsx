import { Box, Typography, useTheme } from '@mui/material';
import { Section } from '../../common';

export const AppTitle = () => {
  const theme = useTheme();

  return (
    <Section
      sx={{
        background: 'transparent',
        boxShadow: 'none',
        color: 'var(--text-color)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        width: '100%',
      }}
    >
      <Box
        component='img'
        src='/logo.svg'
        alt='JOI.how'
        sx={{
          padding: `${theme.spacing(5)} 0 ${theme.spacing(4)} 0`,
          width: '200px',
          aspectRatio: '1',
        }}
      />
      <Typography
        variant='h1'
        fontSize='3rem'
        fontWeight='bold'
        sx={{
          marginBottom: '32px',
        }}
      >
        <Typography
          fontSize='inherit'
          component='abbr'
          title='Jack Off Instructions'
          fontWeight='inherit'
          sx={{
            textDecoration: 'none',
            background: 'rgba(70, 87, 105, 0.4)',
            padding: '5px 20px',
            margin: '0 10px',
          }}
        >
          JOI
        </Typography>
        <Typography fontSize='80%' fontWeight='inherit' component='sup'>
          .how
        </Typography>
      </Typography>
    </Section>
  );
};
