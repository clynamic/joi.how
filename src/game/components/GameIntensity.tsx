import { useGameState } from '../hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFire } from '@fortawesome/free-solid-svg-icons';
import { ProgressBar } from '../../common';
import styled from 'styled-components';

const StyledIntensityMeter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin: 8px;
`;

export const GameIntensity = () => {
  const { intensity } = useGameState(['core.intensity']);

  return (
    <StyledIntensityMeter>
      <ProgressBar
        progress={Math.round(intensity * 100)}
        direction='vertical'
        background='rgba(255, 255, 255, 0.3)'
        color='#fff'
      />
      <FontAwesomeIcon
        icon={faFire}
        color={`rgb(255, ${Math.round(255 - intensity * 255)}, ${Math.round(255 - intensity * 255)})`}
      />
    </StyledIntensityMeter>
  );
};
