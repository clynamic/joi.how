import { Section } from '../../common';
import {
  Box,
  CardActionArea,
  Stack,
  Typography,
  ThemeProvider,
} from '@mui/material';

export const WallTakerAd = () => {
  return (
    <Section
      sx={{
        background: 'linear-gradient(#ffb300, #916706)',
        color: '#583c0f',
        overflow: 'hidden',
        transition: 'transform 0.2s',
        padding: 0,
        '&:hover': {
          transform: 'scale(1.05)',
        },
      }}
    >
      <ThemeProvider
        theme={theme => ({
          ...theme,
          components: {
            MuiCardActionArea: {
              styleOverrides: {
                focusHighlight: {
                  backgroundColor: 'transparent',
                },
              },
            },
          },
        })}
      >
        <CardActionArea
          href='https://walltaker.joi.how'
          target='_blank'
          sx={{
            padding: '12px 16px',
            paddingRight: '46px',
            paddingBottom: '16px',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              bottom: '-50px',
              right: '-40px',
              height: '180px',
              aspectRatio: '1/1',
              position: 'absolute',
              backgroundImage:
                'url(https://walltaker.joi.how/assets/mascot/TaylorSFW-1f4700509acff90902c73b80246473840a4879dca17a0052e0d8a41b1e4556e2.png)',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
              backgroundPosition: 'right bottom',
            }}
          />
          <Stack sx={{}}>
            <Typography
              variant='h2'
              fontSize='1.1rem'
              fontWeight='bold'
              sx={{
                margin: '3px 0px 10px',
              }}
            >
              Want to let other people set your wallpaper?
            </Typography>
            <Typography variant='body2' lineHeight={1.8}>
              Checkout walltaker! It&apos;s an app made by gray and the other
              folks at PawCorp, the little horny-coding collective! It lets you
              up a link where people can set the wallpaper on you phone or PC to
              an e621 post, within your blacklist!
            </Typography>
          </Stack>
        </CardActionArea>
      </ThemeProvider>
    </Section>
  );
};
