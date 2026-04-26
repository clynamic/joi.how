import {
  ToyActuator,
  VibrationActuator,
  VibrateMode,
  VibrateModeLabels,
  LinearActuator,
  LinearMode,
  LinearModeLabels,
} from '../../toy';
import { FormEvent, PropsWithChildren, useState } from 'react';
import { Fields } from '../../common';
import { SettingsDescription } from '../../common/SettingsDescription';
import {
  WaButton,
  WaDropdown,
  WaDropdownItem,
  WaSlider,
} from '@awesome.me/webawesome/dist/react';
import { ActuatorType } from 'buttplug';
import { Space } from '../../common/Space';
import { WaSelectEvent } from '@awesome.me/webawesome/dist/events/select.js';
import { WaSliderProps } from '@awesome.me/webawesome/dist/custom-elements-jsx.d.ts';

export interface ToySettingsProps extends PropsWithChildren<
  React.HTMLAttributes<HTMLFieldSetElement>
> {
  toyActuator: ToyActuator;
}

export const ToyActuatorSettings: React.FC<ToySettingsProps> = ({
  toyActuator,
}) => {
  return (
    <Fields
      key={`${toyActuator.actuatorType} ${toyActuator.index + 1}`}
      label={`${toyActuator.actuatorType} ${toyActuator.index + 1}`}
    >
      {(() => {
        switch (toyActuator.actuatorType) {
          case ActuatorType.Vibrate:
            return <VibratorActuatorSettings toyActuator={toyActuator} />;
          case ActuatorType.Position:
            return <PositionActuatorSettings toyActuator={toyActuator} />;
          default:
            return <UnknownActuatorSettings />;
        }
      })()}
    </Fields>
  );
};

export const VibratorActuatorSettings: React.FC<ToySettingsProps> = ({
  toyActuator,
}) => {
  const vibratorActuator = toyActuator as VibrationActuator;
  const descriptor = `${vibratorActuator.actuatorType}_${vibratorActuator.index}`;
  const [mode, setMode] = useState(vibratorActuator.mode);
  const [min, setMin] = useState(vibratorActuator.currentMinIntensity);
  const [max, setMax] = useState(vibratorActuator.currentMaxIntensity);

  return (
    <div key={`${descriptor}_settings`}>
      <SettingsDescription>
        Select when this component will activate.
      </SettingsDescription>
      <WaDropdown
        id={`${descriptor}_mode`}
        children={Array(
          <WaButton
            key={`${descriptor}_dropdown`}
            appearance='filled'
            slot='trigger'
            withCaret
          >
            {VibrateModeLabels[mode]}
          </WaButton>
        ).concat(
          Object.values(VibrateMode).map(mode => (
            <WaDropdownItem
              value={mode}
              key={`${descriptor}_${VibrateModeLabels[mode]}`}
            >
              {VibrateModeLabels[mode]}
            </WaDropdownItem>
          ))
        )}
        onWaSelect={(event: WaSelectEvent) => {
          const newMode = (event.detail.item as HTMLInputElement)
            .value as VibrateMode;
          setMode(newMode);
          vibratorActuator.setMode(newMode);
        }}
      ></WaDropdown>
      <Space size='medium' />
      <SettingsDescription>
        Change the range of intensity for this component.
      </SettingsDescription>
      <WaSlider
        id={`{${descriptor}_range}`}
        range={true}
        min={vibratorActuator.absMinIntensity}
        max={vibratorActuator.absMaxIntensity}
        minValue={min}
        maxValue={max}
        step={vibratorActuator.intensityStepSize}
        withTooltip={true}
        valueFormatter={value =>
          Intl.NumberFormat('en-US', { style: 'percent' }).format(value)
        }
        onInput={(event: FormEvent) => {
          const sliderProps = event.target as WaSliderProps;
          setMin(sliderProps.minValue as number);
          setMax(sliderProps.maxValue as number);
          vibratorActuator.setMinIntensity(sliderProps.minValue as number);
          vibratorActuator.setMaxIntensity(sliderProps.maxValue as number);
        }}
      >
        <span slot='reference'>{vibratorActuator.absMinIntensity * 100}%</span>
        <span slot='reference'>
          {(vibratorActuator.absMaxIntensity * 100) / 2}%
        </span>
        <span slot='reference'>{vibratorActuator.absMaxIntensity * 100}%</span>
      </WaSlider>
    </div>
  );
};

export const PositionActuatorSettings: React.FC<ToySettingsProps> = ({
  toyActuator,
}) => {
  const linearActuator = toyActuator as LinearActuator;
  const descriptor = `${linearActuator.actuatorType}_${linearActuator.index}`;
  const [mode, setMode] = useState(linearActuator.mode);
  const [min, setMin] = useState(linearActuator.currentMinPosition);
  const [max, setMax] = useState(linearActuator.currentMaxPosition);

  return (
    <div>
      <SettingsDescription>
        Select when this component will activate.
      </SettingsDescription>
      <WaDropdown
        id={`${descriptor}_mode`}
        children={Array(
          <WaButton
            key={`${descriptor}_dropdown`}
            appearance='filled'
            slot='trigger'
            withCaret
          >
            {LinearModeLabels[mode]}
          </WaButton>
        ).concat(
          Object.values(LinearMode).map(mode => (
            <WaDropdownItem
              value={mode}
              key={`${descriptor}_${LinearModeLabels[mode]}`}
            >
              {LinearModeLabels[mode]}
            </WaDropdownItem>
          ))
        )}
        onWaSelect={(event: WaSelectEvent) => {
          const newMode = (event.detail.item as HTMLInputElement)
            .value as LinearMode;
          setMode(newMode);
          linearActuator.setMode(newMode);
        }}
      ></WaDropdown>
      <SettingsDescription>
        Change the range of motion for this component.
      </SettingsDescription>
      <WaSlider
        id={`{${descriptor}_range}`}
        range={true}
        min={linearActuator.absMinPosition}
        max={linearActuator.absMaxPosition}
        minValue={min}
        maxValue={max}
        step={linearActuator.positionStepSize}
        withTooltip={true}
        valueFormatter={value =>
          Intl.NumberFormat('en-US', { style: 'percent' }).format(value)
        }
        onInput={(event: FormEvent) => {
          const sliderProps = event.target as WaSliderProps;
          setMin(sliderProps.minValue as number);
          setMax(sliderProps.maxValue as number);
          linearActuator.setMinPosition(sliderProps.minValue as number);
          linearActuator.setMaxPosition(sliderProps.maxValue as number);
        }}
      >
        <span slot='reference'>{linearActuator.absMinPosition * 100}%</span>
        <span slot='reference'>
          {(linearActuator.absMaxPosition * 100) / 2}%
        </span>
        <span slot='reference'>{linearActuator.absMaxPosition * 100}%</span>
      </WaSlider>
    </div>
  );
};

export const UnknownActuatorSettings = () => {
  return (
    <SettingsDescription>
      This component is not currently supported.
    </SettingsDescription>
  );
};
