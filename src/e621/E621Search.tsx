import {
  Measure,
  SettingsLabel,
  Space,
  SettingsInfo,
  StyledMeasure,
  SettingsDescription,
  JoiToggleTile,
  SettingsRow,
  SettingsGrid,
  JoiStack,
} from '../common';
import { useCallback, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { useDispatchEvent, useGameFrame } from '../game/hooks';
import ClassicImages from '../game/plugins/classicImages';
import { PendingRequest } from '../engine/pipes/Requests';
import { useE621Setting } from './E621Provider';
import {
  E621Service,
  E621SortOrder,
  e621SortOrderLabels,
} from '../services/e621';
import { AnimatePresence, motion } from 'framer-motion';
import { E621CredentialsInput } from './E621Credentials';
import { defaultTransition } from '../utils';
import {
  WaButton,
  WaIcon,
  WaTooltip,
  WaSlider,
  WaInput,
  WaSelect,
  WaOption,
  WaTextarea,
} from '@awesome.me/webawesome/dist/react';

export const E621Search = () => {
  const [tags, setTags] = useE621Setting('search');
  const [limit, setLimit] = useE621Setting('limit');
  const [order, setOrder] = useE621Setting('order');
  const [minScore, setMinScore] = useE621Setting('minScore');
  const [credentials, setCredentials] = useE621Setting('credentials');
  const [addingCredentials, setAddingCredentials] = useState(false);
  const [enableBlacklist, setEnableBlacklist] =
    useE621Setting('enableBlacklist');
  const [blacklist, setBlacklist] = useE621Setting('blacklist');

  const { inject } = useDispatchEvent();
  const e621Service = useMemo(() => new E621Service(), []);
  const pending = useGameFrame<Record<string, PendingRequest> | undefined>([
    'core.requests',
    'pending',
  ]);
  const loading = Object.values(pending ?? {}).some(
    request => request.type === 'core.e621/search'
  );

  const runSearch = useCallback(() => {
    inject(
      ClassicImages.searchE621({
        tags,
        limit,
        order,
        minScore,
        credentials,
        blacklist: enableBlacklist ? blacklist : undefined,
      })
    );
  }, [
    inject,
    tags,
    limit,
    order,
    minScore,
    credentials,
    enableBlacklist,
    blacklist,
  ]);

  const onToggleCredentials = useCallback(() => {
    if (credentials) {
      setCredentials(undefined);
    } else {
      setAddingCredentials(!addingCredentials);
    }
  }, [credentials, setCredentials, addingCredentials, setAddingCredentials]);

  return (
    <SettingsGrid>
      <SettingsDescription>Add images from e621</SettingsDescription>
      <SettingsRow>
        <SettingsLabel htmlFor='tags'>Tags</SettingsLabel>
        <WaInput
          id='tags'
          className='joi-wide'
          value={tags}
          onInput={e => setTags(e.currentTarget.value || '')}
          onSubmit={runSearch}
          placeholder='e.g. dragon huge_penis'
          disabled={loading}
        />
      </SettingsRow>
      <Space size='medium' />
      <SettingsRow>
        <SettingsLabel htmlFor='order'>Order</SettingsLabel>
        <WaSelect
          id='order'
          className='joi-wide'
          value={order}
          onInput={e => setOrder(e.currentTarget.value as E621SortOrder)}
          disabled={loading}
        >
          {Object.values(E621SortOrder).map(value => (
            <WaOption key={value} value={value}>
              {e621SortOrderLabels[value]}
            </WaOption>
          ))}
        </WaSelect>
      </SettingsRow>
      <Space size='medium' />
      <SettingsRow>
        <SettingsLabel htmlFor='limit'>Count</SettingsLabel>
        <WaSlider
          id='limit'
          value={limit}
          onInput={e => setLimit(parseFloat(e.currentTarget.value.toString()))}
          min={1}
          max={200}
          step={1}
          style={{ width: '100%' }}
        />
        <Measure value={limit} chars={3} unit='posts' />
      </SettingsRow>
      <Space size='medium' />
      <SettingsRow>
        <SettingsLabel htmlFor='minScore'>Score</SettingsLabel>
        <WaSlider
          id='minScore'
          value={minScore ?? -1}
          onInput={e => {
            const value = parseFloat(e.currentTarget.value.toString());
            setMinScore(value === -1 ? undefined : value);
          }}
          min={-1}
          max={50}
          step={1}
          style={{ width: '100%' }}
        />
        {minScore == undefined || minScore === -1 ? (
          <StyledMeasure>
            <strong>any</strong>
          </StyledMeasure>
        ) : (
          <Measure value={minScore ?? -1} chars={3} unit='votes' />
        )}
      </SettingsRow>
      <Space size='medium' />
      <JoiToggleTile
        style={{ '--tile-inactive-opacity': 1 } as React.CSSProperties}
        type={'check'}
        value={!!credentials || addingCredentials}
        onClick={onToggleCredentials}
      >
        <h6 className='subtitle'>Credentials</h6>
        <p className='caption'>
          Use your e621 account to access restricted content
        </p>
      </JoiToggleTile>
      <AnimatePresence>
        {/* 
        Toggling this rapidly will lead to it being stuck open. 
        This is a bug in framer-motion, and tracked here: https://github.com/framer/motion/issues/2554
      */}
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
              <p style={{ display: 'inline' }}>
                You are logged in as <strong>{credentials.username}</strong>{' '}
                <FontAwesomeIcon icon={faUser} />
              </p>
            </SettingsInfo>
          </motion.div>
        )}
      </AnimatePresence>
      <JoiToggleTile
        style={{ '--tile-inactive-opacity': 1 } as React.CSSProperties}
        type={'check'}
        value={enableBlacklist}
        onClick={() => setEnableBlacklist(!enableBlacklist)}
      >
        <h6 className='subtitle'>Enable blacklist</h6>
        <p className='caption'>Hide posts with specific tags</p>
      </JoiToggleTile>
      <AnimatePresence>
        {enableBlacklist && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={defaultTransition}
          >
            <WaTooltip for='blacklist-info'>View blacklist help</WaTooltip>
            <WaTooltip for='blacklist-refresh'>
              Download blacklist from e621
            </WaTooltip>
            <JoiStack direction='row' justifyContent='space-between'>
              <SettingsInfo>Blacklist</SettingsInfo>
              <JoiStack direction='row'>
                <WaButton
                  id='blacklist-info'
                  href='https://e621.net/help/blacklist'
                  target='_blank'
                  size='small'
                >
                  <WaIcon name='info-circle' />
                </WaButton>
                <WaButton
                  id='blacklist-refresh'
                  size='small'
                  disabled={!credentials}
                  onClick={() =>
                    e621Service.getBlacklist(credentials!).then(setBlacklist)
                  }
                >
                  <WaIcon name='sync' />
                </WaButton>
              </JoiStack>
            </JoiStack>
            <WaTextarea
              style={{ resize: 'vertical' }}
              value={blacklist?.join('\n') ?? ''}
              onInput={e =>
                setBlacklist(
                  (e.currentTarget.value || '')
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
      <WaButton
        onClick={runSearch}
        style={{
          justifySelf: 'center',
        }}
        loading={loading}
      >
        <p>Search & Add</p>
        <WaIcon slot='end' name='search' />
      </WaButton>
      <Space size='medium' />
    </SettingsGrid>
  );
};
