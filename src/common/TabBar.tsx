import styled from 'styled-components';

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

const StyledTabBar = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const StyledTab = styled.button<{
  $active?: boolean;
  $index?: number;
}>`
  width: fit-content;
  padding: 4px 8px;
  line-height: 100%;
  font-size: 1rem;

  background: ${({ $active }) =>
    $active ? 'var(--legend-background)' : 'var(--section-background)'};
  color: var(--button-color);

  border-left: ${({ $index: index }) =>
    index && index > 0 ? '1px solid currentColor' : 'unset'};

  cursor: pointer;

  transition: var(--hover-transition);

  &:hover:not(:disabled) {
    background: var(--primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  current: activeTab,
  onChange: setActiveTab,
}) => {
  return (
    <StyledTabBar>
      {tabs.map((tab, i) => (
        <StyledTab
          key={tab.id}
          $active={tab.id === activeTab}
          onClick={() => setActiveTab(tab.id)}
          disabled={tab.disabled}
          $index={i}
        >
          {tab.content}
        </StyledTab>
      ))}
    </StyledTabBar>
  );
};
