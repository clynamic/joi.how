import { PulseLoader } from 'react-spinners';
import { LoaderSizeMarginProps } from 'react-spinners/helpers/props';

export const Spinner: React.FC<LoaderSizeMarginProps> = ({ ...props }) => {
  return (
    <PulseLoader
      color={'currentColor'}
      size={'0.8rem'}
      speedMultiplier={0.5}
      {...props}
    />
  );
};
