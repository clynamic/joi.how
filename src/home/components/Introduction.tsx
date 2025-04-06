import { Link, Typography } from '@mui/material';
import { Section } from '../../common';

export const Introduction = () => {
  return (
    <Section>
      <Typography variant='body2' lineHeight={1.8}>
        Select your settings, and this app will guide ya&apos; thru a jack-off
        session. You can adjust most of the aspects of the game, as well as
        select some porn to help with &quot;motivation&quot;. It&apos;s all
        pulled from{' '}
        <Link href='https://e621.net' target='_blank' color={'inherit'}>
          e621.net
        </Link>
        .{' '}
        <Typography variant='inherit' component={'span'} fontWeight='bold'>
          You are responsible for what you choose to look at.
        </Typography>
      </Typography>
    </Section>
  );
};
