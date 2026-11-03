import styled, { CSSProperties } from 'styled-components';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  direction?: 'vertical' | 'horizontal';
  background?: CSSProperties['backgroundColor'];
  color?: CSSProperties['color'];
}
const ProgressBarContainer = styled.div<{
  $direction: ProgressBarProps['direction'];
  $background: ProgressBarProps['background'];
}>`
  width: ${({ $direction }) => ($direction === 'horizontal' ? '100%' : '8px')};
  height: ${({ $direction }) => ($direction === 'vertical' ? '100%' : '8px')};
  background-color: ${({ $background }) => $background ?? 'var(--background)'};
  border-radius: var(--border-radius);
  position: relative;
  overflow: hidden;
`;

const ProgressBarFill = styled(motion.div)<{
  $direction: ProgressBarProps['direction'];
  $color: ProgressBarProps['color'];
}>`
  width: ${({ $direction }) =>
    $direction === 'horizontal' ? `${$direction}%` : '100%'};
  height: ${({ $direction }) =>
    $direction === 'vertical' ? `${$direction}%` : '100%'};
  background-color: ${({ $color }) => $color ?? 'var(--primary)'};
  position: absolute;
  bottom: 0;
`;

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  direction = 'horizontal',
  background,
  color,
}) => {
  return (
    <ProgressBarContainer $direction={direction} $background={background}>
      <ProgressBarFill
        $direction={direction}
        $color={color}
        initial={{ width: 0, height: 0 }}
        animate={{
          width: direction === 'horizontal' ? `${progress}%` : '100%',
          height: direction === 'vertical' ? `${progress}%` : '100%',
        }}
        transition={{ duration: 0.5 }}
      />
    </ProgressBarContainer>
  );
};
