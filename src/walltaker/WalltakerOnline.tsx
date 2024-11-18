import styled, { keyframes } from 'styled-components';
import { useWalltaker } from './WalltakerProvider';

const StyledOnlineDotContainer = styled.div`
  display: flex;
  height: 1rem;
  position: relative;
`;

const StyledOnlineDot = styled.div<{
  $online?: boolean;
}>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: ${({ $online }) => ($online ? '#30AA65' : 'transparent')};
  border: ${({ $online }) => ($online ? 'transparent' : '2px solid grey')};
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.4;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
`;

const PulseAnimation = styled.div`
  position: absolute;
  top: 0%;
  left: 0%;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: #30aa65;
  transform: translate(-50%, -50%);
  animation: ${pulse} 2s infinite ease-out;
`;

export const WalltakerOnline = () => {
  const {
    data: { connected },
  } = useWalltaker();

  return (
    <StyledOnlineDotContainer>
      <StyledOnlineDot $online={connected} />
      {connected && <PulseAnimation />}
    </StyledOnlineDotContainer>
  );
};
