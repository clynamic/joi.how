import { Typography } from '@mui/material';

export interface MeasureProps {
  value: number;
  chars: number;
  unit?: string;
}

export const Measure: React.FC<MeasureProps> = ({ value, chars, unit }) => {
  return (
    <Typography
      variant={'caption'}
      whiteSpace={'nowrap'}
      textAlign={'end'}
      fontFamily={'Courier New, Courier, monospace'}
      fontWeight={'bold'}
      sx={{ width: '100%' }}
    >
      {value
        .toString()
        .split('')
        .slice(0, chars)
        .join('')
        .padStart(chars, '\u00A0')}{' '}
      {unit ?? ''}
    </Typography>
  );
};
