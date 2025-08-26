import { ContentSection, JoiStack } from '../../common';
import { version } from '../../../package.json';
import { WaButton, WaIcon, WaTooltip } from '@awesome.me/webawesome/dist/react';
import { Fragment } from 'react/jsx-runtime';

interface AppLink {
  url: string;
  text: string;
  icon: { name: string; family?: string };
}

const appLinks: Record<string, AppLink> = {
  donations: {
    url: 'https://ko-fi.com/binaryfloof',
    text: 'Support us on Ko-fi',
    icon: { name: 'dollar' },
  },
  discord: {
    url: 'https://discord.clynamic.net',
    text: 'Join our Discord',
    icon: { name: 'discord', family: 'brands' },
  },
  github: {
    url: 'https://github.com/clynamic/joi.how',
    text: 'View on GitHub',
    icon: { name: 'github', family: 'brands' },
  },
};

export const VersionDisplay = () => {
  return (
    <ContentSection>
      <JoiStack
        direction='row'
        justifyContent='space-between'
        alignItems='center'
      >
        <h6>Version {version}</h6>
        <JoiStack direction='row' alignItems='center' spacing={1}>
          {Object.keys(appLinks).map(key => (
            <Fragment key={key}>
              <WaTooltip for={`app-link-${key}`}>
                {appLinks[key].text}
              </WaTooltip>
              <WaButton
                id={`app-link-${key}`}
                href={appLinks[key].url}
                target='_blank'
                size='small'
              >
                <WaIcon
                  name={appLinks[key].icon.name}
                  family={appLinks[key].icon.family}
                  style={{
                    fontSize: 'var(--wa-font-size-l)',
                  }}
                />
              </WaButton>
            </Fragment>
          ))}
        </JoiStack>
      </JoiStack>
    </ContentSection>
  );
};
