import { ContentSection } from '../../common';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useHomeValue } from '../HomeProvider';
import { WaDialog } from '@awesome.me/webawesome/dist/react';

const StyledAgeWarningDialog = styled(WaDialog)`
  &::part(dialog) {
    box-shadow: none;
  }

  &::part(dialog)::backdrop {
    backdrop-filter: blur(20px);
  }

  &::part(close-button) {
    display: none;
  }
`;

const StyledAgeWarning = styled.div`
  font-size: 1rem;
  max-width: 400px;
  margin: 0 auto;
`;

const StyledAgeWarningChoice = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

const StyledAgeWarningButton = styled.button`
  display: flex;
  gap: 8px;

  background: var(--button-background);
  color: var(--button-color);

  border-radius: var(--border-radius);
  padding: 8px;

  transition: var(--hover-transition);

  &:hover {
    background: var(--primary);
  }

  &:enabled {
    cursor: pointer;
  }
  &:disabled {
    cursor: not-allowed;
  }
`;

export const AgeWarning = () => {
  const [ageCheckConfirm, setAgeCheckConfirm] = useHomeValue('ageCheckConfirm');

  return (
    <StyledAgeWarningDialog
      open={!ageCheckConfirm}
      onWaHide={() => setAgeCheckConfirm(true)}
      className='dialog-deny-close'
      label={'Age Warning'}
    >
      <StyledAgeWarning>
        <ContentSection style={{ margin: 0 }}>
          <p>
            This app is meant for adults only, and should not be used by anyone
            under the age of 18.
          </p>
          <StyledAgeWarningChoice>
            <StyledAgeWarningButton
              onClick={() => {
                window.location.href = 'https://www.google.com';
              }}
            >
              <p>I am not 18</p>
              <FontAwesomeIcon icon={faBan} />
            </StyledAgeWarningButton>
            <StyledAgeWarningButton onClick={() => setAgeCheckConfirm(true)}>
              <p>I am 18 or older</p>
              <FontAwesomeIcon icon={faCheck} />
            </StyledAgeWarningButton>
          </StyledAgeWarningChoice>
        </ContentSection>
      </StyledAgeWarning>
    </StyledAgeWarningDialog>
  );
};
