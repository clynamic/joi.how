import { AnimatePresence, motion } from 'framer-motion';
import { WaSlider } from '@awesome.me/webawesome/dist/react';
import styled from 'styled-components';
import {
  SettingsDescription,
  Fields,
  JoiToggleTile,
  SettingsLabel,
  Measure,
  ColorPicker,
  RGBA,
  SettingsRow,
} from '../../../common';
import { useSetting, subsetting } from '../../SettingsProvider';
import { defaultTransition } from '../../../utils';

// ----------------------------
// settings grid but with motion
const StyledSettingsGrid = motion(styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  column-gap: 1rem;

  & > :not([data-settings-row='true']) {
    grid-column: 1 / -1;
  }
`);
// ----------------------------

export const HypnoSpiralSettings = () => {
  const h = useSetting('hypno');

  const [spiralEnabled, setSpiralEnabled] = subsetting(h, 'spiralEnabled');
  const [spinSpeed, setSpinSpeed] = subsetting(h, 'spiralSpinSpeed');
  const [throbSpeed, setThrobSpeed] = subsetting(h, 'spiralThrobSpeed');
  const [throbStrength, setThrobStrength] = subsetting(
    h,
    'spiralThrobStrength'
  );
  const [zoom, setZoom] = subsetting(h, 'spiralZoom');
  const [primary, setPrimary] = subsetting(h, 'spiralPrimary');
  const [secondary, setSecondary] = subsetting(h, 'spiralSecondary');
  const [rainbowColors, setRainbowColors] = subsetting(
    h,
    'spiralRainbowColors'
  );
  const [rainbowSaturation, setRainbowSaturation] = subsetting(
    h,
    'spiralRainbowSaturation'
  );
  const [rainbowLightness, setRainbowLightness] = subsetting(
    h,
    'spiralRainbowLightness'
  );
  const [rainbowHueSpeed, setRainbowHueSpeed] = subsetting(
    h,
    'spiralRainbowHueSpeed'
  );

  return (
    <Fields label={'Hypno Spiral'}>
      <SettingsDescription>Select your hypno spiral</SettingsDescription>
      <JoiToggleTile
        value={spiralEnabled}
        onClick={() => setSpiralEnabled(!spiralEnabled)}
        type='check'
      >
        <strong>Enable Spiral</strong>
        <p>Display a hypno spiral in the game</p>
      </JoiToggleTile>
      <AnimatePresence>
        {spiralEnabled && (
          <StyledSettingsGrid
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ gridColumn: '1 / -1' }}
            transition={defaultTransition}
          >
            <SettingsRow>
              <SettingsLabel htmlFor='spinSpeed'>Spin Speed</SettingsLabel>
              <WaSlider
                id='spinSpeed'
                value={spinSpeed}
                min={0}
                step={0.1}
                max={5}
                onInput={e => setSpinSpeed(e.currentTarget.value)}
                style={{ width: '100%' }}
              />
              <Measure value={spinSpeed} chars={3} />
            </SettingsRow>
            <SettingsRow>
              <SettingsLabel htmlFor='throbSpeed'>Throb Speed</SettingsLabel>
              <WaSlider
                id='throbSpeed'
                value={throbSpeed}
                min={0}
                step={0.1}
                max={5}
                onInput={e => setThrobSpeed(e.currentTarget.value)}
                style={{ width: '100%' }}
              />
              <Measure value={throbSpeed} chars={3} />
            </SettingsRow>
            <SettingsRow>
              <SettingsLabel htmlFor='throbStrength'>
                Throb Strength
              </SettingsLabel>
              <WaSlider
                id='throbStrength'
                value={throbStrength}
                min={0}
                step={0.1}
                max={5}
                onInput={e => setThrobStrength(e.currentTarget.value)}
                style={{ width: '100%' }}
              />
              <Measure value={throbStrength} chars={3} />
            </SettingsRow>
            <SettingsRow>
              <SettingsLabel htmlFor='zoom'>Zoom Out</SettingsLabel>
              <WaSlider
                id='zoom'
                value={zoom}
                min={0.1}
                step={0.1}
                max={5}
                onInput={e => setZoom(e.currentTarget.value)}
                style={{ width: '100%' }}
              />
              <Measure value={zoom} chars={3} />
            </SettingsRow>
            <ColorPicker
              label='Primary Color'
              color={primary}
              onChange={(value: RGBA) => setPrimary(value)}
            />
            <JoiToggleTile
              value={rainbowColors}
              onClick={() => setRainbowColors(!rainbowColors)}
              type='check'
            >
              <strong>Rainbow Colors</strong>
              <p>Use a rainbow cycle for the secondary color</p>
            </JoiToggleTile>
            {!rainbowColors && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ gridColumn: '1 / -1' }}
                transition={defaultTransition}
              >
                <ColorPicker
                  label='Secondary Color'
                  color={secondary}
                  onChange={(value: RGBA) => setSecondary(value)}
                />
              </motion.div>
            )}
            {rainbowColors && (
              <StyledSettingsGrid
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ gridColumn: '1 / -1' }}
                transition={defaultTransition}
              >
                <SettingsRow>
                  <SettingsLabel htmlFor='rainbowSaturation'>
                    Rainbow Saturation
                  </SettingsLabel>
                  <WaSlider
                    id='rainbowSaturation'
                    value={rainbowSaturation}
                    min={0}
                    step={10}
                    max={200}
                    onInput={e => setRainbowSaturation(e.currentTarget.value)}
                    style={{ width: '100%' }}
                  />
                  <Measure value={rainbowSaturation} chars={3} unit='%' />
                </SettingsRow>
                <SettingsRow>
                  <SettingsLabel htmlFor='rainbowLightness'>
                    Rainbow Lightness
                  </SettingsLabel>
                  <WaSlider
                    id='rainbowLightness'
                    value={rainbowLightness}
                    min={0}
                    step={5}
                    max={100}
                    onInput={e => setRainbowLightness(e.currentTarget.value)}
                    style={{ width: '100%' }}
                  />
                  <Measure value={rainbowLightness} chars={3} unit='%' />
                </SettingsRow>
                <SettingsRow>
                  <SettingsLabel htmlFor='rainbowHueSpeed'>
                    Rainbow Hue Speed
                  </SettingsLabel>
                  <WaSlider
                    id='rainbowHueSpeed'
                    value={rainbowHueSpeed}
                    min={0}
                    step={0.1}
                    max={5}
                    onInput={e => setRainbowHueSpeed(e.currentTarget.value)}
                    style={{ width: '100%' }}
                  />
                  <Measure value={rainbowHueSpeed} chars={3} />
                </SettingsRow>
              </StyledSettingsGrid>
            )}
          </StyledSettingsGrid>
        )}
      </AnimatePresence>
    </Fields>
  );
};
