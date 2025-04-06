import { Fields, TabBar } from '../../common';
import { E621Search } from '../../e621';
import { useState } from 'react';
import { WalltakerSearch } from '../../walltaker';
import { LocalImport } from '../../local';

const tabs: Record<string, React.ReactNode> = {
  e621: <E621Search />,
  walltaker: <WalltakerSearch />,
  local: <LocalImport />,
};

type Tab = keyof typeof tabs;

export const ServiceSettings = () => {
  const [activeTab, setActiveTab] = useState<Tab>('e621');

  return (
    <Fields
      sx={{
        '& > legend': {
          background: 'var(--card-background)',
          padding: 0,
        },
      }}
      label={
        <TabBar
          tabs={[
            { id: 'e621', content: 'e621' },
            // { id: 'walltaker', content: 'Walltaker' },
            { id: 'local', content: 'Device' },
          ]}
          current={activeTab}
          onChange={setActiveTab}
        />
      }
    >
      {tabs[activeTab]}
    </Fields>
  );
};
