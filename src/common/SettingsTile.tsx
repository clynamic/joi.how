import { PropsWithChildren } from 'react';
import styled from 'styled-components';

export interface SettingsTileProps
  extends PropsWithChildren<React.HTMLAttributes<HTMLFieldSetElement>> {
  label: React.ReactNode;
  grid?: boolean;
}

const StyledSettingsTile = styled.fieldset<{ $grid?: boolean }>`
  display: ${({ $grid }) => ($grid ? 'grid' : 'flex')};
  flex-direction: column;
  grid-template-columns: auto 1fr auto;
  grid-auto-rows: min-content;

  background: rgba(122, 123, 163, 0.123);
  color: #b9bad6;

  font-size: 0.8rem;

  border: unset;
  border-left: 2px solid #595a77; // TODO: use css variable

  margin: 15px;
  padding: 5px 15px;

  position: relative;
`;

const StyledSettingsLabel = styled.legend`
  width: fit-content;
  padding: 4px 8px;
  background: #595a77; // TODO: use css variable
  color: var(--text-color);
  line-height: 100%;
  font-size: 1rem;
`;

export const SettingsTile: React.FC<SettingsTileProps> = ({
  label,
  children,
  grid,
  ...props
}) => {
  return (
    <StyledSettingsTile $grid={grid} {...props}>
      <StyledSettingsLabel>{label}</StyledSettingsLabel>
      {children}
    </StyledSettingsTile>
  );
};
