import { marked } from 'marked';
import { useEffect, useState } from 'react';
import { WaDetails, WaSpinner } from '@awesome.me/webawesome/dist/react';
import styled from 'styled-components';
import { ContentSection } from '../../common';

const StyledWaDetails = styled(WaDetails)`
  &::part(header) {
    transition: background var(--wa-transition-normal);
    border-radius: var(--wa-form-control-border-radius);
  }

  &::part(header):hover {
    background: var(--button-background);
  }

  &[open]::part(header) {
    background: var(--button-background);
  }

  &::part(content) {
    background: var(--button-background);
    border-radius: var(--wa-form-control-border-radius);
    margin-top: var(--wa-space-s);
  }
`;

const StyledReleaseNotesBody = styled.div`
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;

  h1 {
    font-size: 1.75rem;
  }
  h2 {
    font-size: 1.5rem;
  }
  h3 {
    font-size: 1.25rem;
  }
  h4 {
    font-size: 1rem;
  }
  h5 {
    font-size: 0.875rem;
  }
  h6 {
    font-size: 0.75rem;
  }
  p {
    line-height: 1.5;
  }
`;

export const ReleaseNotes = () => {
  const [changelog, setChangelog] = useState(null as string | null);

  useEffect(() => {
    fetch('/CHANGELOG.md')
      .then(response => response.text())
      .then(async text => setChangelog(await marked(text)));
  }, []);

  return (
    <ContentSection>
      <StyledWaDetails appearance='plain'>
        <h4 slot='summary'>Release Notes</h4>
        <StyledReleaseNotesBody>
          {changelog ? (
            <div dangerouslySetInnerHTML={{ __html: changelog }} />
          ) : (
            <WaSpinner style={{ fontSize: '2.4rem' }} />
          )}
        </StyledReleaseNotesBody>
      </StyledWaDetails>
    </ContentSection>
  );
};
