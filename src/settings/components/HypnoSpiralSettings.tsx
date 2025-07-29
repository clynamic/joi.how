import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';

import {
  SettingsTile,
  SettingsDescription,
  ToggleTile,
  ToggleTileType,
  SettingsLabel,
  Slider,
  Measure,
  ColorPicker,
  RGBA,
} from '../../common';
import { useSetting } from '../SettingsProvider';
import { defaultTransition } from '../../utils';

const SliderSettingContainer = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
`;

export const HypnoSpiralSettings = () => {
  const [spiralEnabled, setSpiralEnabled] = useSetting('hypnoSpiralEnabled');
  const [spinSpeed, setSpinSpeed] = useSetting('hypnoSpiralSpinSpeed');
  const [throbSpeed, setThrobSpeed] = useSetting('hypnoSpiralThrobSpeed');
  const [throbStrength, setThrobStrength] = useSetting(
    'hypnoSpiralThrobStrength'
  );
  const [zoom, setZoom] = useSetting('hypnoSpiralZoom');
  const [primary, setPrimary] = useSetting('hypnoSpiralPrimary');
  const [secondary, setSecondary] = useSetting('hypnoSpiralSecondary');
  const [rainbowColors, setRainbowColors] = useSetting(
    'hypnoSpiralRainbowColors'
  );
  const [rainbowSaturation, setRainbowSaturation] = useSetting(
    'hypnoSpiralRainbowSaturation'
  );
  const [rainbowLightness, setRainbowLightness] = useSetting(
    'hypnoSpiralRainbowLightness'
  );
  const [rainbowHueSpeed, setRainbowHueSpeed] = useSetting(
    'hypnoSpiralRainbowHueSpeed'
  );

  return (
    <SettingsTile label={'Hypno Spiral'}>
      <SettingsDescription>Select your hypno spiral</SettingsDescription>
      <ToggleTile
        value={spiralEnabled}
        onClick={() => setSpiralEnabled(!spiralEnabled)}
        type={ToggleTileType.check}
      >
        <strong>Enable Spiral</strong>
        <p>Display a hypno spiral in the game</p>
      </ToggleTile>
      <AnimatePresence>
        {spiralEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ gridColumn: '1 / -1' }}
            transition={defaultTransition}
          >
            <SliderSettingContainer>
              <SettingsLabel htmlFor='spinSpeed'>Spin Speed</SettingsLabel>
              <Slider
                id='spinSpeed'
                value={spinSpeed}
                min='0'
                step='0.1'
                max='5'
                onChange={(value: number) => setSpinSpeed(value)}
              />
              <Measure value={spinSpeed} chars={3} />
              <SettingsLabel htmlFor='throbSpeed'>Throb Speed</SettingsLabel>
              <Slider
                id='throbSpeed'
                value={throbSpeed}
                min='0'
                step='0.1'
                max='5'
                onChange={(value: number) => setThrobSpeed(value)}
              />
              <Measure value={throbSpeed} chars={3} />
              <SettingsLabel htmlFor='throbStrength'>
                Throb Strength
              </SettingsLabel>
              <Slider
                id='throbStrength'
                value={throbStrength}
                min='0'
                step='0.1'
                max='5'
                onChange={(value: number) => setThrobStrength(value)}
              />
              <Measure value={throbStrength} chars={3} />
              <SettingsLabel htmlFor='zoom'>Zoom Out</SettingsLabel>
              <Slider
                id='zoom'
                value={zoom}
                min='0.1'
                step='0.1'
                max='5'
                onChange={(value: number) => setZoom(value)}
              />
              <Measure value={zoom} chars={3} />
            </SliderSettingContainer>
            <ColorPicker
              label='Primary Color'
              color={primary}
              onChange={(value: RGBA) => setPrimary(value)}
            />
            <ToggleTile
              value={rainbowColors}
              onClick={() => setRainbowColors(!rainbowColors)}
              type={ToggleTileType.check}
            >
              <strong>Rainbow Colors</strong>
              <p>Use a rainbow cycle for the secondary color</p>
            </ToggleTile>
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
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ gridColumn: '1 / -1' }}
                transition={defaultTransition}
              >
                <SliderSettingContainer>
                  <SettingsLabel htmlFor='rainbowSaturation'>
                    Rainbow Saturation
                  </SettingsLabel>
                  <Slider
                    id='rainbowSaturation'
                    value={rainbowSaturation}
                    min='0'
                    step='10'
                    max='200'
                    onChange={(value: number) => setRainbowSaturation(value)}
                  />
                  <Measure value={rainbowSaturation} chars={3} unit='%' />
                  <SettingsLabel htmlFor='rainbowLightness'>
                    Rainbow Lightness
                  </SettingsLabel>
                  <Slider
                    id='rainbowLightness'
                    value={rainbowLightness}
                    min='0'
                    step='5'
                    max='100'
                    onChange={(value: number) => setRainbowLightness(value)}
                  />
                  <Measure value={rainbowLightness} chars={3} unit='%' />
                  <SettingsLabel htmlFor='rainbowHueSpeed'>
                    Rainbow Hue Speed
                  </SettingsLabel>
                  <Slider
                    id='rainbowHueSpeed'
                    value={rainbowHueSpeed}
                    min='0'
                    step='0.1'
                    max='5'
                    onChange={(value: number) => setRainbowHueSpeed(value)}
                  />
                  <Measure value={rainbowHueSpeed} chars={3} />
                </SliderSettingContainer>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </SettingsTile>
  );
};
