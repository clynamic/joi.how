import { JoiStack, Space } from '../../common';
import styled from 'styled-components';
import { useKeys } from '../../game/hooks';
import Home from '../../game/plugins/home';
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
  const [{ ageCheckConfirm }, set] = useKeys(Home.keys);

  return (
    <StyledAgeWarningDialog
      open={!ageCheckConfirm}
      onWaHide={() => set('ageCheckConfirm', true)}
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
          <span>I am not an adult</span>
          <WaIcon slot='end' name={'ban'} />
        </WaButton>
        <WaButton onClick={() => set('ageCheckConfirm', true)}>
          <span>I am an adult</span>
          <WaIcon slot='end' name={'check'} />
        </WaButton>
      </JoiStack>
    </StyledAgeWarningDialog>
  );
};
