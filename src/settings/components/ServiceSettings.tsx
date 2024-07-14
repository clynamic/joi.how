import styled from 'styled-components';
import { SettingsTile, TabBar } from '../../common';
import { E621Search } from '../../e621';
import { useState } from 'react';
import { WalltalkerSearch } from '../../walltalker';
import { LocalImport } from '../../local';

const TabSettingsTile = styled(SettingsTile)`
  & > legend {
    background: var(--card-background);
    padding: 0;
  }
`;

export const ServiceSettings = () => {
  const [activeTab, setActiveTab] = useState<
    'e621' | 'walltalker' | 'localimport'
  >('e621');

  return (
    <TabSettingsTile
      label={
        <TabBar
          tabs={[
            { id: 'e621', content: 'e621' },
            // { id: 'walltalker', content: 'Walltalker' },
            { id: 'localimport', content: 'local import' },
          ]}
          current={activeTab}
          onChange={id =>
            setActiveTab(id as 'e621' | 'walltalker' | 'localimport')
          }
        />
      }
    >
      {activeTab === 'e621' && <E621Search />}
      {activeTab === 'walltalker' && <WalltalkerSearch />}
      {activeTab === 'localimport' && <LocalImport />}
    </TabSettingsTile>
  );
};
