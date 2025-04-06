import { Section } from '../../common';
import { Box, Typography } from '@mui/material';

export const Instructions = () => {
  return (
    <Section>
      <Typography variant='h2' fontSize='1.3rem' sx={{ padding: '0px 16px' }}>
        Rules
      </Typography>
      <Box component='ul'>
        <li>Only focus on the porn on screen</li>
        <li>Keep your strokes to the pace of the center circle</li>
        <li>Watch out for events announced on the right side</li>
      </Box>
    </Section>
  );
};
