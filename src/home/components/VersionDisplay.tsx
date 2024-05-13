import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ContentSection, IconButton } from '../../common';
import { faDiscord, faGithub } from '@fortawesome/free-brands-svg-icons';
import styled from 'styled-components';
import { version } from '../../../package.json';
import { faDollar } from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

const StyledVersionDisplay = styled(ContentSection)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

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

const StyledAppLink = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const VersionDisplay = () => {
  return (
    <StyledVersionDisplay>
      <p>Version {version}</p>
      <StyledAppLink style={{ display: 'flex' }}>
        {Object.keys(appLinks).map(key => (
          <IconButton
            key={key}
            tooltip={appLinks[key].text}
            onClick={() => window.open(appLinks[key].url, '_blank')}
            icon={<FontAwesomeIcon icon={appLinks[key].icon} />}
          />
        ))}
      </StyledAppLink>
    </StyledVersionDisplay>
  );
};
