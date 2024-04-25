import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ContentSection, IconButton } from '../../common';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import styled from 'styled-components';
import { version } from '../../../package.json';

const StyledVersionDisplay = styled(ContentSection)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const VersionDisplay = () => {
  return (
    <StyledVersionDisplay>
      <p>Version {version}</p>
      <IconButton
        onClick={() =>
          window.open('https://github.com/clynamic/joi.how', '_blank')
        }
      >
        <FontAwesomeIcon icon={faGithub} />
      </IconButton>
    </StyledVersionDisplay>
  );
};
