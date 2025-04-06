import { Section } from '../../common';
import { useImages } from '../../settings';
import { useNavigate } from 'react-router-dom';
import { Button, Stack, Typography } from '@mui/material';

export const StartButton = () => {
  const [images] = useImages();
  const navigate = useNavigate();

  return (
    <Section
      sx={{
        background: 'transparent',
        boxShadow: 'none',
      }}
    >
      <Stack spacing={2} alignItems='center' direction='column'>
        {images.length === 0 && (
          <Typography variant='subtitle1' align='center'>
            Lets add some images before we start!
          </Typography>
        )}
        <Button
          variant='contained'
          color='primary'
          size='large'
          sx={{
            textTransform: 'uppercase',
            fontSize: '1.5rem',
          }}
          disabled={images.length === 0}
          onClick={() => navigate('/play')}
        >
          begin
        </Button>
      </Stack>
    </Section>
  );
};
