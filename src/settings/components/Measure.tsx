import styled from 'styled-components';

export interface MeasureProps {
  value: number;
  max: number;
  unit?: string;
}

const StyledMeasure = styled.span`
  white-space: nowrap;
  text-align: end;
  font-family: 'Helvetica Neue', monospace;
`;

export const Measure: React.FC<MeasureProps> = ({ value, max, unit }) => {
  return (
    <StyledMeasure>
      <strong>
        {Math.ceil(value).toString().padStart(max, '\u00A0')} {unit}
      </strong>
    </StyledMeasure>
  );
};
