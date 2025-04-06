import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Section } from '../../common';
import { faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons';
import { version } from '../../../package.json';
import { faDollar } from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { Stack, Typography, IconButton, Tooltip } from '@mui/material';

interface AppLink {
  url: string;
  text: string;
  icon: IconProp;
}

const appLinks: Record<string, AppLink> = {
  donations: {
    url: 'https://ko-fi.com/binaryfloof',
    text: 'Support us on Ko-fi',
    icon: faDollar,
  },
  discord: {
    url: 'https://discord.clynamic.net',
    text: 'Join our Discord',
    icon: faDiscord,
  },
  github: {
    url: 'https://github.com/clynamic/joi.how',
    text: 'View on GitHub',
    icon: faGithub,
  },
};

export const VersionDisplay = () => {
  return (
    <Section>
      <Stack
        direction='row'
        spacing={2}
        justifyContent='space-between'
        alignItems='center'
      >
        <Typography variant='body2'>Version {version}</Typography>
        <Stack direction='row' gap={0.5}>
          {Object.keys(appLinks).map(key => (
            <Tooltip key={key} arrow title={appLinks[key].text}>
              <IconButton
                href={appLinks[key].url}
                target='_blank'
                sx={{
                  padding: 0.5,
                  aspectRatio: 1,
                  fontSize: '1.4rem',
                  width: '2rem',
                }}
                children={<FontAwesomeIcon icon={appLinks[key].icon} />}
              />
            </Tooltip>
          ))}
        </Stack>
      </Stack>
    </Section>
  );
};
