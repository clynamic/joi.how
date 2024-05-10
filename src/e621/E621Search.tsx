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
} from '../common';
import { useCallback, useMemo, useState } from 'react';
import { E621Service } from './E621Service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faUser } from '@fortawesome/free-solid-svg-icons';
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

export const E621Search = () => {
  const [, setLoading] = useState(false);

  const [tags, setTags] = useE621Setting('search');
  const [limit, setLimit] = useE621Setting('limit');
  const [order, setOrder] = useE621Setting('order');
  const [credentials, setCredentials] = useE621Setting('credentials');
  const [addingCredentials, setAddingCredentials] = useState(false);

  const setImages = useImages()[1];
  const e621Service = useMemo(() => new E621Service(), []);

  const runSearch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await e621Service.getImages({
        tags: tags,
        limit,
        order,
      });
      setImages(images => [
        ...result.filter(image => !images.some(i => i.id === image.id)),
        ...images,
      ]);
    } finally {
      setLoading(false);
    }
  }, [e621Service, tags, limit, order, setImages]);

  const onToggleCredentials = useCallback(() => {
    if (credentials) {
      setCredentials(undefined);
    } else {
      setAddingCredentials(!addingCredentials);
    }
  }, [credentials, setCredentials, addingCredentials, setAddingCredentials]);

  return (
    <StyledE621Search>
      <Surrounded
        trailing={
          <IconButton
            onClick={runSearch}
            icon={<FontAwesomeIcon icon={faSearch} />}
          />
        }
      >
        <TextInput
          value={tags}
          onChange={setTags}
          onSubmit={runSearch}
          placeholder='Enter tags...'
        />
      </Surrounded>
      <Space size='medium' />
      <SettingsLabel>Count</SettingsLabel>
      <Slider value={limit} onChange={setLimit} min={1} max={200} step={1} />
      <Measure value={limit} chars={3} unit='posts' />
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
      />
      <Space size='medium' />
      <ToggleTile
        style={{ opacity: 1 }}
        type={ToggleTileType.check}
        enabled={!!credentials || addingCredentials}
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
              }}
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
            <SettingsLabel>
              <p>
                You are logged in as <strong>{credentials.username}</strong>
              </p>
              <Space size='small' />
              <FontAwesomeIcon icon={faUser} />
            </SettingsLabel>
          </motion.div>
        )}
      </AnimatePresence>
      <Space size='medium' />
    </StyledE621Search>
  );
};
