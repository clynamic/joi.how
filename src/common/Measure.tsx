import styled from 'styled-components';

export interface MeasureProps {
  value: number;
  chars: number;
  unit?: string;
}

export const StyledMeasure = styled.span`
  white-space: nowrap;
  text-align: end;
  font-family: 'Courier New', Courier, monospace;
`;

export const Measure: React.FC<MeasureProps> = ({ value, chars, unit }) => {
  return (
    <StyledMeasure>
      <strong>
        {value
          .toString()
          .split('')
          .slice(0, chars)
          .join('')
          .padStart(chars, '\u00A0')}{' '}
        {unit ?? ''}
      </strong>
    </StyledMeasure>
  );
};
