import styled from 'styled-components';
import {
  Dropdown,
  IconButton,
  Measure,
  SettingsLabel,
  Slider,
  Space,
  TextInput,
  Surrounded,
  ToggleTile,
  ToggleTileType,
  TextArea,
  SettingsDescription,
  Spinner,
} from '../common';
import { useCallback, useMemo, useState } from 'react';
import { E621Service } from './E621Service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInfoCircle,
  faSync,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { useImages } from '../settings';
import {
  E621SortOrder,
  e621SortOrderLabels,
  useE621Setting,
} from './E621Provider';
import { AnimatePresence, motion } from 'framer-motion';
import { E621CredentialsInput } from './E621Credentials';
import { defaultTransition } from '../utils';

const StyledE621Search = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
`;

const StyledE621SearchButton = styled.button`
  grid-column: 1 / -1;
  justify-self: center;
  padding: 8px 16px;
  background: var(--focus-color);
  color: var(--text-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: var(--primary);
  }
`;

export const E621Search = () => {
  const [loading, setLoading] = useState(false);

  const [tags, setTags] = useE621Setting('search');
  const [limit, setLimit] = useE621Setting('limit');
  const [order, setOrder] = useE621Setting('order');
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
    <StyledE621Search>
      <SettingsLabel>Tags</SettingsLabel>
      <TextInput
        value={tags}
        onChange={setTags}
        onSubmit={runSearch}
        placeholder='Enter tags...'
        style={{ gridColumn: '2 / -1' }}
        disabled={loading}
      />
      <Space size='medium' />
      <SettingsLabel>Order</SettingsLabel>
      <Dropdown
        value={order}
        onChange={(value: string) => setOrder(value as E621SortOrder)}
        options={Object.values(E621SortOrder).map(value => ({
          value,
          label: e621SortOrderLabels[value],
        }))}
        style={{ gridColumn: '2 / -1' }}
        disabled={loading}
      />
      <Space size='medium' />
      <SettingsLabel>Count</SettingsLabel>
      <Slider value={limit} onChange={setLimit} min={1} max={200} step={1} />
      <Measure value={limit} chars={3} unit='posts' />
      <Space size='medium' />
      <ToggleTile
        style={{ opacity: 1 }}
        type={ToggleTileType.check}
        value={!!credentials || addingCredentials}
        onClick={onToggleCredentials}
      >
        <strong>Credentials</strong>
        <p>Use your e621 account to access restricted content</p>
      </ToggleTile>
      <AnimatePresence>
        {/* 
        Toggling this rapidly will lead to it being stuck open. 
        This is a bug in framer-motion, and tracked here: https://github.com/framer/motion/issues/2554
      */}
        {addingCredentials && (
          <motion.div
            key='credentials-input'
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ gridColumn: '1 / -1' }}
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
            key='credentials-label'
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ gridColumn: '1 / -1' }}
            transition={defaultTransition}
          >
            <SettingsDescription>
              <p>
                You are logged in as <strong>{credentials.username}</strong>
              </p>
              <Space size='small' />
              <FontAwesomeIcon icon={faUser} />
            </SettingsDescription>
          </motion.div>
        )}
      </AnimatePresence>
      <ToggleTile
        style={{ opacity: 1 }}
        type={ToggleTileType.check}
        value={enableBlacklist}
        onClick={() => setEnableBlacklist(!enableBlacklist)}
      >
        <strong>Enable blacklist</strong>
        <p>Hide posts with specific tags</p>
      </ToggleTile>
      <AnimatePresence>
        {enableBlacklist && (
          <motion.div
            key='blacklist-label'
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ gridColumn: '1 / -1' }}
            transition={defaultTransition}
          >
            <Surrounded
              trailing={
                <>
                  <IconButton
                    style={{ fontSize: '1rem' }}
                    tooltip='View blacklist help'
                    onClick={() =>
                      window.open('https://e621.net/help/blacklist')
                    }
                    icon={<FontAwesomeIcon icon={faInfoCircle} />}
                  />
                  <IconButton
                    style={{ fontSize: '1rem' }}
                    tooltip='Download blacklist from e621'
                    onClick={
                      credentials
                        ? () =>
                            e621Service
                              .getBlacklist(credentials)
                              .then(setBlacklist)
                        : undefined
                    }
                    icon={<FontAwesomeIcon icon={faSync} />}
                  />
                </>
              }
            >
              <SettingsDescription>Blacklist</SettingsDescription>
            </Surrounded>
            <TextArea
              style={{ resize: 'vertical' }}
              value={blacklist?.join('\n') ?? ''}
              onChange={(value: string) =>
                setBlacklist(
                  value
                    .split('\n')
                    .map(tag => tag.trim())
                    .filter(tag => tag)
                )
              }
              placeholder='Enter tags...'
            />
          </motion.div>
        )}
      </AnimatePresence>
      <Space size='medium' />
      <StyledE621SearchButton
        onClick={runSearch}
        disabled={loading}
        style={{ gridColumn: '1 / -1' }}
      >
        {loading ? <Spinner /> : <strong>Search & Add</strong>}
      </StyledE621SearchButton>
      <Space size='medium' />
    </StyledE621Search>
  );
};
