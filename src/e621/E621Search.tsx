import {
  Measure,
  SettingsLabel,
  Space,
  ToggleCard,
  ToggleTileType,
  SettingsInfo,
  SettingsDescription,
  SettingsGrid,
  SettingsRow,
} from '../common';
import { useCallback, useMemo, useState } from 'react';
import { E621Service } from './E621Service';
import { useImages } from '../settings';
import {
  E621SortOrder,
  e621SortOrderLabels,
  useE621Setting,
} from './E621Provider';
import { AnimatePresence, motion } from 'framer-motion';
import { E621CredentialsInput } from './E621Credentials';
import { defaultTransition } from '../utils';
import {
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Info, Sync, Person } from '@mui/icons-material';

export const E621Search = () => {
  const [loading, setLoading] = useState(false);

  const [tags, setTags] = useE621Setting('search');
  const [limit, setLimit] = useE621Setting('limit');
  const [order, setOrder] = useE621Setting('order');
  const [minScore, setMinScore] = useE621Setting('minScore');
  const [credentials, setCredentials] = useE621Setting('credentials');
  const [addingCredentials, setAddingCredentials] = useState(false);
  const [enableBlacklist, setEnableBlacklist] =
    useE621Setting('enableBlacklist');
  const [blacklist, setBlacklist] = useE621Setting('blacklist');

  const setImages = useImages()[1];
  const e621Service = useMemo(() => new E621Service(), []);

  const runSearch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await e621Service.getImages({
        tags: tags,
        limit,
        order,
        credentials,
        blacklist: enableBlacklist ? blacklist : undefined,
      });
      setImages(images => [
        ...result.filter(image => !images.some(i => i.id === image.id)),
        ...images,
      ]);
    } finally {
      setLoading(false);
    }
  }, [
    e621Service,
    tags,
    limit,
    order,
    credentials,
    enableBlacklist,
    blacklist,
    setImages,
  ]);

  const onToggleCredentials = useCallback(() => {
    if (credentials) {
      setCredentials(undefined);
    } else {
      setAddingCredentials(!addingCredentials);
    }
  }, [credentials, setCredentials, addingCredentials, setAddingCredentials]);

  return (
    <SettingsGrid sx={{ gap: 2 }}>
      <SettingsDescription>Add images from e621</SettingsDescription>
      <SettingsRow>
        <SettingsLabel htmlFor='tags'>Tags</SettingsLabel>
        <TextField
          id='tags'
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder='Enter tags...'
          disabled={loading}
          onSubmit={runSearch}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              runSearch();
            }
          }}
          fullWidth
          size='small'
        />
      </SettingsRow>
      <SettingsRow>
        <SettingsLabel htmlFor='order'>Order</SettingsLabel>
        <Select
          id='order'
          placeholder='Order'
          value={order}
          onChange={event => setOrder(event.target.value as E621SortOrder)}
          disabled={loading}
          fullWidth
        >
          {Object.values(E621SortOrder).map(value => (
            <MenuItem key={value} value={value}>
              {e621SortOrderLabels[value]}
            </MenuItem>
          ))}
        </Select>
      </SettingsRow>
      <SettingsRow>
        <SettingsLabel htmlFor='limit'>Count</SettingsLabel>
        <Slider
          id='limit'
          value={limit}
          onChange={(_, value) => setLimit(value as number)}
          min={1}
          max={200}
          step={1}
        />
        <Measure value={limit} chars={3} unit='posts' />
      </SettingsRow>
      <SettingsRow>
        <SettingsLabel htmlFor='minScore'>Score</SettingsLabel>
        <Slider
          id='minScore'
          value={minScore ?? -1}
          onChange={(_, value) => {
            setMinScore(value === -1 ? undefined : (value as number));
          }}
          min={-1}
          max={50}
          step={1}
        />
        <Measure
          value={minScore ?? -1}
          chars={minScore == undefined || minScore === -1 ? 0 : 3}
          unit={minScore == undefined || minScore === -1 ? 'any' : 'votes'}
        />
      </SettingsRow>
      <Stack>
        <ToggleCard
          style={{ opacity: 1 }}
          type={ToggleTileType.check}
          value={!!credentials || addingCredentials}
          onClick={onToggleCredentials}
        >
          <Typography variant='subtitle2'>Credentials</Typography>
          <Typography variant='caption'>
            Use your e621 account to access restricted content
          </Typography>
        </ToggleCard>
        <AnimatePresence>
          {addingCredentials && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={defaultTransition}
            >
              <E621CredentialsInput
                service={e621Service}
                onSaved={credentials => {
                  setCredentials(credentials);
                  setAddingCredentials(false);
                  if (!blacklist || !blacklist.length) {
                    e621Service.getBlacklist(credentials).then(setBlacklist);
                  }
                }}
                disabled={loading}
              />
            </motion.div>
          )}
          {credentials && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={defaultTransition}
            >
              <SettingsInfo>
                <Typography
                  variant='caption'
                  component='p'
                  sx={{ display: 'inline' }}
                >
                  You are logged in as <strong>{credentials.username}</strong>{' '}
                </Typography>
                <Person fontSize='small' style={{ verticalAlign: 'middle' }} />
              </SettingsInfo>
            </motion.div>
          )}
        </AnimatePresence>
      </Stack>
      <ToggleCard
        style={{ opacity: 1 }}
        type={ToggleTileType.check}
        value={enableBlacklist}
        onClick={() => setEnableBlacklist(!enableBlacklist)}
      >
        <Typography variant='subtitle2'>Enable blacklist</Typography>
        <Typography variant='caption'>Hide posts with specific tags</Typography>
      </ToggleCard>
      <AnimatePresence>
        {enableBlacklist && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={defaultTransition}
          >
            <Stack direction='row' justifyContent={'space-between'}>
              <SettingsDescription>Blacklist</SettingsDescription>
              <Stack direction='row'>
                <Tooltip title='View blacklist help'>
                  <IconButton
                    size='small'
                    onClick={() =>
                      window.open('https://e621.net/help/blacklist')
                    }
                  >
                    <Info />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Download blacklist from e621'>
                  <IconButton
                    size='small'
                    onClick={
                      credentials
                        ? () =>
                            e621Service
                              .getBlacklist(credentials)
                              .then(setBlacklist)
                        : undefined
                    }
                    disabled={!credentials}
                  >
                    <Sync />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
            <TextField
              multiline
              minRows={3}
              maxRows={10}
              sx={{ resize: 'vertical' }}
              value={blacklist?.join('\n') ?? ''}
              onChange={event =>
                setBlacklist(
                  event.target.value
                    .split('\n')
                    .map(tag => tag.trim())
                    .filter(tag => tag)
                )
              }
              placeholder='Enter tags...'
              fullWidth
            />
          </motion.div>
        )}
      </AnimatePresence>
      <Button
        onClick={runSearch}
        variant='contained'
        disabled={loading}
        sx={{
          justifySelf: 'center',
        }}
      >
        {loading ? (
          <CircularProgress size={24} />
        ) : (
          <Typography>Search & Add</Typography>
        )}
      </Button>
      <Space size='medium' />
    </SettingsGrid>
  );
};
