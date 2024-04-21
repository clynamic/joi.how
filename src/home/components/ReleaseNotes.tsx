import { faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import { marked } from 'marked';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { ContentSection } from '../../common';

const StyledExpandButton = styled.button`
  display: flex;
  justify-content: space-between;

  width: 100%;

  border-radius: var(--border-radius);
  background: transparent;
  color: var(--text-color);

  transition: var(--hover-transition);

  cursor: pointer;

  padding: 15px;

  &:hover {
    background: var(--focus-color);
  }

  &[aria-expanded='true'] {
    background: var(--focus-color);
  }
`;

const StyledReleaseNotesBody = styled.div`
  padding: 20px;
  background: #47495a;
  border-radius: var(--border-radius);
`;

export const ReleaseNotes = () => {
  const [changelog, setChangelog] = useState(null as string | null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('/CHANGELOG.md')
      .then(response => response.text())
      .then(async text => setChangelog(await marked(text)));
  }, []);

  const toggleOpen = () => setOpen(!open);

  return (
    <ContentSection>
      <StyledExpandButton onClick={toggleOpen} aria-expanded={open}>
        <h2>Release Notes</h2>
        <motion.h2
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.4 }}
        >
          <FontAwesomeIcon icon={faAngleDown} />
        </motion.h2>
      </StyledExpandButton>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{
          marginTop: open ? '10px' : 0,
          opacity: open ? 1 : 0,
          height: open ? '500px' : 0,
          overflowY: 'auto',
        }}
        transition={{
          duration: 0.4,
          ease: [0.19, 1, 0.22, 1],
        }}
      >
        <StyledReleaseNotesBody>
          {changelog ? (
            <div dangerouslySetInnerHTML={{ __html: changelog }} />
          ) : (
            'Loading...'
          )}
        </StyledReleaseNotesBody>
      </motion.div>
    </ContentSection>
  );
};
