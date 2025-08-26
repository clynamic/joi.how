import { PropsWithChildren } from 'react';
import styled from 'styled-components';
import { SettingsGrid } from './SettingsGrid';

export interface FieldsProps
  extends PropsWithChildren<React.HTMLAttributes<HTMLFieldSetElement>> {
  label?: React.ReactNode;
}

const StyledFields = styled.fieldset`
  display: flex;
  flex-direction: column;

  background: var(--section-background);
  color: #b9bad6;

  border: unset;
  border-left: 2px solid var(--legend-background);
  border-radius: unset;

  margin: 15px;
  padding: 5px 15px;

  position: relative;
`;

const StyledFieldsLegend = styled.legend`
  width: fit-content;
  padding: 4px 8px;
  background: var(--legend-background);
  color: var(--legend-color);
  line-height: 100%;
  font-size: 1rem;
`;

export const Fields: React.FC<FieldsProps> = ({
  label: legend,
  children,
  ...props
}) => {
  return (
    <StyledFields {...props}>
      {legend && <StyledFieldsLegend>{legend}</StyledFieldsLegend>}
      <SettingsGrid>{children}</SettingsGrid>
    </StyledFields>
  );
};
