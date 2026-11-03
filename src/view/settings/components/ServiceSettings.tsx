import { E621Search } from '../../e621';
import { useState } from 'react';
import { WalltakerSearch } from '../../walltaker';
import { LocalImport } from '../../local';
import { WaTabGroup, WaTab } from '@awesome.me/webawesome/dist/react';
import styled from 'styled-components';
import { Fields } from '../../common';

const tabs: Record<
  string,
  {
    label: string;
    component: React.ReactNode;
  }
> = {
  e621: {
    label: 'e621',
    component: <E621Search />,
  },
  walltaker: {
    label: 'Walltaker',
    component: <WalltakerSearch />,
  },
  local: {
    label: 'Device',
    component: <LocalImport />,
  },
};

type Tab = keyof typeof tabs;

const StyledServiceFields = styled(Fields)`
  & legend {
    padding: 0;
  }
`;

const StyledServiceSettingsTabs = styled.div`
  wa-tab::part(base) {
    padding: var(--wa-space-2xs) var(--wa-space-xs);
  }

  wa-tab {
    background: var(--section-background);
    transition: background var(--wa-transition-normal);
  }

  wa-tab[active] {
    background: var(--legend-background);
    color: var(--wa-color-foreground);
  }
`;

export const ServiceSettings = () => {
  const [activeTab, setActiveTab] = useState<Tab>('e621');

  return (
    <StyledServiceFields
      label={
        <StyledServiceSettingsTabs>
          <WaTabGroup onWaTabShow={event => setActiveTab(event.detail.name)}>
            {Object.keys(tabs)
              .filter(key => key !== 'walltaker') // not ready
              .map(tab => (
                <WaTab key={tab} panel={tab} active={activeTab === tab}>
                  {tabs[tab].label}
                </WaTab>
              ))}
          </WaTabGroup>
        </StyledServiceSettingsTabs>
      }
    >
      {tabs[activeTab].component}
    </StyledServiceFields>
  );
};
