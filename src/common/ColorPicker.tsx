import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

// 0-255
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

const RelativeDiv = styled.div`
  position: relative;
`;

const Checkerboard = styled.div`
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(45deg, #ddd 25%, transparent 25%),
    linear-gradient(-45deg, #ddd 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ddd 75%),
    linear-gradient(-45deg, transparent 75%, #ddd 75%);
  background-size: 8px 8px;
  background-position:
    0 0,
    0 4px,
    4px -4px,
    -4px 0;
  border-radius: 0.75rem;
  z-index: 0;
`;

const StyledColorTile = styled.button<{ $active: boolean }>`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--button-color);
  border-radius: var(--border-radius);
  border: none;
  opacity: ${({ $active }) => ($active ? 1 : 0.3)};
  transition:
    opacity 0.2s,
    background 0.2s;
  padding: 10px 14px;
  margin: 10px 0;
  cursor: pointer;

  &:hover {
    background: var(--primary);
  }
`;

const TileContent = styled.div`
  display: flex;
  flex-direction: column;
  text-align: start;
`;

const ColorSwatchWrapper = styled.div`
  position: relative;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const VisibleColorSwatch = styled.div<{ color: string }>`
  width: 100%;
  height: 100%;
  border-radius: var(--border-radius);
  background-color: ${({ color }) => color};
  z-index: 1;
`;

const Popover = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 100;
  background: var(--background);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-width: 220px;
`;

const SliderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SliderLabel = styled.span`
  font-size: 0.8rem;
  color: var(--text-color);
  display: flex;
  justify-content: space-between;
`;

const Slider = styled.input`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: white;
    border: 1px solid var(--border-color);
    cursor: pointer;
  }
`;

const HueSlider = styled(Slider)`
  background: linear-gradient(
    to right,
    #f00,
    #ff0,
    #0f0,
    #0ff,
    #00f,
    #f0f,
    #f00
  );
`;

const AlphaSlider = styled(Slider)<{ hue: number }>`
  color: ${({ hue }) => `hsl(${hue * 360}, 100%, 50%)`};
  background: linear-gradient(to right, transparent, currentColor);
`;

const SaturationValueArea = styled.div<{ hue: number }>`
  position: relative;
  width: 100%;
  height: 150px;
  border-radius: var(--border-radius);
  background: linear-gradient(
    to right,
    white,
    hsl(${({ hue }) => hue * 360}, 100%, 50%)
  );
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, #000, transparent);
  }
`;

const PickerCursor = styled.div<{ x: number; y: number }>`
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  transform: translate(-50%, -50%);
  left: ${({ x }) => x * 100}%;
  top: ${({ y }) => y * 100}%;
  z-index: 2;
  pointer-events: none;
`;

const HexInput = styled.input`
  width: 100%;
  padding: 8px;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  background: var(--input-background);
  color: var(--text-color);
  font-family: monospace;
  font-size: 0.9rem;
`;

function rgbaToHex({ r, g, b, a }: RGBA): string {
  return `#${[r, g, b, a].map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

function rgbaToHsv({ r, g, b }: RGBA): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    delta = max - min,
    v = max,
    s = max === 0 ? 0 : delta / max;
  let h = 0;
  if (delta !== 0) {
    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      default:
        h = (r - g) / delta + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, v];
}

function hsvToRgba(h: number, s: number, v: number, a: number): RGBA {
  const i = Math.floor(h * 6),
    f = h * 6 - i,
    p = v * (1 - s),
    q = v * (1 - f * s),
    t = v * (1 - (1 - f) * s);
  let r = 0,
    g = 0,
    b = 0;
  switch (i % 6) {
    case 0:
      [r, g, b] = [v, t, p];
      break;
    case 1:
      [r, g, b] = [q, v, p];
      break;
    case 2:
      [r, g, b] = [p, v, t];
      break;
    case 3:
      [r, g, b] = [p, q, v];
      break;
    case 4:
      [r, g, b] = [t, p, v];
      break;
    default:
      [r, g, b] = [v, p, q];
      break;
  }
  return { r: r * 255, g: g * 255, b: b * 255, a: a * 255 };
}

function rgbaToCss({ r, g, b, a }: RGBA): string {
  return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
}

function hexToRgba(hex: string): RGBA {
  const clean = hex.replace(/^#/, ''),
    r = parseInt(clean.slice(0, 2), 16),
    g = parseInt(clean.slice(2, 4), 16),
    b = parseInt(clean.slice(4, 6), 16),
    a = clean.length >= 8 ? parseInt(clean.slice(6, 8), 16) : 255;
  return { r, g, b, a };
}

interface ColorPickerTileProps {
  label: string;
  description?: string;
  color: RGBA;
  onChange: (color: RGBA) => void;
}

export const ColorPicker: React.FC<ColorPickerTileProps> = ({
  label,
  description = '',
  color,
  onChange,
}) => {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(1);
  const [value, setValue] = useState(0.5);
  const [alpha, setAlpha] = useState(1);
  const [hex, setHex] = useState('#00000000');
  const [showPicker, setShowPicker] = useState(false);

  const areaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInteracting = useRef(false);

  useEffect(() => {
    const [h, s, v] = rgbaToHsv(color);
    setHue(h);
    setSaturation(s);
    setValue(v);
    setAlpha(color.a / 255);
    setHex(rgbaToHex(color));
  }, [color]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node))
        setShowPicker(false);
    };
    if (showPicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

  const updateColor = (h: number, s: number, v: number, a: number) => {
    const newColor = hsvToRgba(h, s, v, a);
    onChange(newColor);
  };

  const handleAreaChange = (e: MouseEvent | React.MouseEvent) => {
    if (!areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    updateColor(hue, x, 1 - y, alpha);
  };

  const startInteraction = (e: React.MouseEvent) => {
    isInteracting.current = true;
    handleAreaChange(e);

    const move = (e: MouseEvent) =>
      isInteracting.current && handleAreaChange(e);
    const up = () => {
      isInteracting.current = false;
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  const currentColor = hsvToRgba(hue, saturation, value, alpha);
  const colorString = rgbaToCss(currentColor);

  return (
    <RelativeDiv ref={containerRef}>
      <StyledColorTile
        $active
        type='button'
        onClick={() => setShowPicker(!showPicker)}
      >
        <TileContent>
          <strong>{label}</strong>
          <p>{description}</p>
        </TileContent>
        <ColorSwatchWrapper>
          <Checkerboard />
          <VisibleColorSwatch color={colorString} />
        </ColorSwatchWrapper>
      </StyledColorTile>

      {showPicker && (
        <Popover>
          <SaturationValueArea
            hue={hue}
            ref={areaRef}
            onMouseDown={startInteraction}
          >
            <PickerCursor x={saturation} y={1 - value} />
          </SaturationValueArea>

          <SliderContainer>
            <SliderLabel>
              <span>Hue</span>
            </SliderLabel>
            <HueSlider
              type='range'
              min='0'
              max='1'
              step='0.01'
              value={hue}
              onChange={e =>
                updateColor(
                  parseFloat(e.target.value),
                  saturation,
                  value,
                  alpha
                )
              }
            />
          </SliderContainer>

          <SliderContainer>
            <SliderLabel>
              <span>Opacity</span>
              <span>{Math.round(alpha * 100)}%</span>
            </SliderLabel>
            <AlphaSlider
              type='range'
              min='0'
              max='1'
              step='0.01'
              value={alpha}
              hue={hue}
              onChange={e =>
                updateColor(hue, saturation, value, parseFloat(e.target.value))
              }
            />
          </SliderContainer>

          <HexInput
            value={hex}
            onChange={e => {
              const val = e.target.value.replace(/^#/, '');
              if (/^[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(val)) {
                onChange(hexToRgba(`#${val}`));
              } else if (val.length <= 8) setHex(`#${val}`);
            }}
            spellCheck={false}
          />
        </Popover>
      )}
    </RelativeDiv>
  );
};
