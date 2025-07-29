import { useEffect, useRef, useState } from 'react';
import { Node, Shaders } from 'gl-react';
import { Surface } from 'gl-react-dom';
import styled from 'styled-components';
import { colord } from 'colord';

import { useSetting } from '../../settings';

const shader = Shaders.create({
  spiral: {
    frag: `
      precision highp float;

      varying vec2 uv;

      uniform vec4 spiralColor;
      uniform vec4 bgColor;
      uniform vec2 iRes;
      uniform float iTime;
      uniform float spinSpeed;
      uniform float throbSpeed;
      uniform float throbStrength;
      uniform float zoom;

      void main() {
        vec2 truPos = vec2(1.0, iRes.y / iRes.x) * (uv - vec2(0.5, 0.5)) * 2.0;
        float angle = atan(truPos.y, truPos.x);
        float dist = pow(length(truPos), .4 + sin((iTime + cos(iTime * .05) * 0.1) * throbSpeed) * 0.2 * throbStrength);
        float spiFactor = clamp(pow(sin(angle + dist * 40. * zoom - iTime * 5. * spinSpeed) + 1.0, 50.), 0., 1.);

        gl_FragColor = mix(spiralColor, bgColor, spiFactor);
      }
    `,
  },
});

const StyledGameHypnoSpiral = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

export const GameHypnoSpiral = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const targetRef = useRef<HTMLDivElement>(null);

  const [spiralEnabled] = useSetting('hypnoSpiralEnabled');
  const [spinSpeed] = useSetting('hypnoSpiralSpinSpeed');
  const [throbSpeed] = useSetting('hypnoSpiralThrobSpeed');
  const [throbStrength] = useSetting('hypnoSpiralThrobStrength');
  const [zoom] = useSetting('hypnoSpiralZoom');
  const [primary] = useSetting('hypnoSpiralPrimary');
  const [secondary] = useSetting('hypnoSpiralSecondary');
  const secc = { ...secondary };
  const [rainbowColors] = useSetting('hypnoSpiralRainbowColors');
  const [rainbowSaturation] = useSetting('hypnoSpiralRainbowSaturation');
  const [rainbowLightness] = useSetting('hypnoSpiralRainbowLightness');
  const [rainbowHueSpeed] = useSetting('hypnoSpiralRainbowHueSpeed');

  const iTime = performance.now() / 1000.0;

  if (rainbowColors) {
    const newColor = colord({
      h: (iTime * 10.0 * rainbowHueSpeed) % 360,
      s: rainbowSaturation,
      l: rainbowLightness,
    }).toRgb();
    secc.r = newColor.r;
    secc.g = newColor.g;
    secc.b = newColor.b;
  }

  useEffect(() => {
    const nextFrame = () => {
      // redraw
      setDimensions(d => ({ ...d }));
      requestAnimationFrame(nextFrame);
    };
    requestAnimationFrame(nextFrame);
  }, []);

  useEffect(() => {
    if (!targetRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDimensions({ width, height });
    });
    observer.observe(targetRef.current);
    return () => observer.disconnect();
  }, [targetRef]);

  return (
    <StyledGameHypnoSpiral ref={targetRef}>
      {spiralEnabled && (
        <Surface
          width={dimensions.width}
          height={dimensions.height}
          webglContextAttributes={{ alpha: true, premultipliedAlpha: false }}
        >
          <Node
            shader={shader.spiral}
            uniforms={{
              spiralColor: [
                primary.r / 255,
                primary.g / 255,
                primary.b / 255,
                primary.a / 255,
              ],
              bgColor: [secc.r / 255, secc.g / 255, secc.b / 255, secc.a / 255],
              iRes: [dimensions.width, dimensions.height],
              iTime,
              spinSpeed,
              throbSpeed,
              throbStrength,
              zoom,
            }}
          />
        </Surface>
      )}
    </StyledGameHypnoSpiral>
  );
};
