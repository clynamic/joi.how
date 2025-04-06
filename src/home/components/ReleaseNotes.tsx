import { faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import { marked } from 'marked';
import { useEffect, useState } from 'react';
import { Section } from '../../common';
import { Card, Typography, Button, Box, Stack } from '@mui/material';

export const ReleaseNotes = () => {
  const [changelog, setChangelog] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('/CHANGELOG.md')
      .then(response => response.text())
      .then(async text => setChangelog(await marked(text)));
  }, []);

  const toggleOpen = () => setOpen(!open);

  return (
    <Section>
      <Button
        onClick={toggleOpen}
        aria-expanded={open}
        variant='contained'
        sx={{
          width: '100%',
          color: 'var(--button-color)',
          padding: '15px',
          backgroundColor: 'transparent',
          transition: 'var(--hover-transition)',
          '&:hover': {
            backgroundColor: 'var(--button-background)',
          },
          '&[aria-expanded="true"]': {
            backgroundColor: 'var(--button-background)',
          },
        }}
      >
        <Stack direction='row' justifyContent='space-between' width='100%'>
          <Typography variant='h2' fontSize='1.2rem' fontWeight='bold'>
            Release Notes
          </Typography>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.4 }}
          >
            <Typography variant='h2' fontSize='1.2rem' fontWeight='bold'>
              <FontAwesomeIcon icon={faAngleDown} />
            </Typography>
          </motion.div>
        </Stack>
      </Button>
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
        <Card
          sx={{
            padding: '20px',
            backgroundColor: 'var(--button-background)',
            color: 'var(--card-color)',
            fontSize: '0.9rem',
            ul: {
              margin: '0',
            },
          }}
        >
          {changelog ? (
            <Box
              sx={{
                'h1, h2, h3, h4, h5, h6': {
                  margin: '0',
                  marginTop: '10px',
                  color: 'inherit',
                },
              }}
              dangerouslySetInnerHTML={{ __html: changelog }}
            />
          ) : (
            'Loading...'
          )}
        </Card>
      </motion.div>
    </Section>
  );
};
