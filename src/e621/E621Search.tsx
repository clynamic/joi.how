import styled from 'styled-components';
import {
  Dropdown,
  IconButton,
  Measure,
  SettingsLabel,
  Slider,
  Space,
  TextInput,
  Trailing,
} from '../common';
import { useCallback, useMemo, useState } from 'react';
import { E621Service } from './E621Service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { useImages } from '../settings';
import {
  E621SortOrder,
  e621SortOrderLabels,
  useE621Setting,
} from './E621Provider';

const StyledE621Search = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
`;

export const E621Search = () => {
  const [, setLoading] = useState(false);

  const [tags, setTags] = useE621Setting('search');
  const [limit, setLimit] = useE621Setting('limit');
  const [order, setOrder] = useE621Setting('order');

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

  return (
    <StyledE621Search>
      <Trailing
        trailing={
          <IconButton onClick={runSearch}>
            <FontAwesomeIcon icon={faSearch} />
          </IconButton>
        }
      >
        <TextInput
          value={tags}
          onChange={setTags}
          onSubmit={runSearch}
          placeholder='Enter tags...'
        />
      </Trailing>
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
    </StyledE621Search>
  );
};
