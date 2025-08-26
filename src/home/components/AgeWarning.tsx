import { JoiStack, Space } from '../../common';
import styled from 'styled-components';
import { useHomeValue } from '../HomeProvider';
import { WaButton, WaDialog, WaIcon } from '@awesome.me/webawesome/dist/react';

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

export const AgeWarning = () => {
  const [ageCheckConfirm, setAgeCheckConfirm] = useHomeValue('ageCheckConfirm');

  return (
    <StyledAgeWarningDialog
      open={!ageCheckConfirm}
      onWaHide={() => setAgeCheckConfirm(true)}
      className='dialog-deny-close'
      label={'Age Confirmation'}
    >
      <p>
        This app is meant for adults only. By clicking "I am an adult", you
        confirm that you are at least 18 years old.
      </p>
      <Space size='large' />
      <JoiStack direction='row' justifyContent='flex-end' spacing={2}>
        <WaButton href='https://www.google.com' variant='danger'>
          <p>I am not an adult</p>
          <WaIcon slot='end' name={'ban'} />
        </WaButton>
        <WaButton onClick={() => setAgeCheckConfirm(true)}>
          <p>I am an adult</p>
          <WaIcon slot='end' name={'check'} />
        </WaButton>
      </JoiStack>
    </StyledAgeWarningDialog>
  );
};
