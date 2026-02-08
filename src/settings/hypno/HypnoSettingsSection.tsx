import styled from 'styled-components'
import {
  HypnoTextSettings,
  HypnoCustomTextSettings,
  HypnoSpiralSettings,
} from './components'
import { ContentSection } from '../../common'

export const HypnoSettingsContent = () => {
  return (
    <>
      <HypnoTextSettings />
      <HypnoSpiralSettings />
      <HypnoCustomTextSettings />
    </>
  )
}

const StyledHypnoSettingsSection = styled(ContentSection)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 400px), 1fr));
`;

export const HypnoSettingsSection = () => {
  return (
    <StyledHypnoSettingsSection>
      <HypnoSettingsContent />
    </StyledHypnoSettingsSection>
  )
}

