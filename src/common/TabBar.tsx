import { Tab, Tabs } from '@mui/material';

export interface TabBarProps {
  tabs: Tab[];
  current: string;
  onChange: (id: string) => void;
}

export interface Tab {
  id: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  current: activeTab,
  onChange: setActiveTab,
}) => {
  return (
    <Tabs
      variant='scrollable'
      value={activeTab}
      onChange={(_, id) => setActiveTab(id)}
      sx={{
        minHeight: 'unset',
      }}
    >
      {tabs.map(({ id, content, disabled }) => (
        <Tab
          key={id}
          label={content}
          value={id}
          disabled={disabled}
          sx={{
            minHeight: 'unset',
            minWidth: 'unset',
            background:
              activeTab === id
                ? 'var(--legend-background)'
                : 'var(--section-background)',

            fontSize: '1rem',
            lineHeight: '100%',

            '&.MuiButtonBase-root': {
              width: 'fit-content',
              padding: '4px 8px',
              textTransform: 'none',

              '&.Mui-selected': {
                color: 'var(--button-color)',
              },
            },
          }}
        />
      ))}
    </Tabs>
  );
};
