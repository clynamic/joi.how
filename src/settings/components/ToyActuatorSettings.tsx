// import { useActuatorSettings } from '../../utils'
import {
  ToyActuator,
  VibrationActuator,
  ActuatorMode,
  ActuatorModeLabels,
} from '../../utils';
import { PropsWithChildren, useState } from 'react';
// import { Vibrator } from '../../utils/vibrator';
import { SettingsTile } from '../../common';
import { SettingsDescription } from '../../common/SettingsDescription';
import { Dropdown } from '../../common/Dropdown';
import { ActuatorType } from 'buttplug';
import { Space } from '../../common/Space';
import { SettingsLabel } from '../../common/SettingsLabel';

export interface ToySettingsProps
  extends PropsWithChildren<React.HTMLAttributes<HTMLFieldSetElement>> {
  toyActuator: ToyActuator;
}

export const ToyActuatorSettings: React.FC<ToySettingsProps> = ({
  toyActuator,
}) => {
  return (
    <SettingsTile
      label={`${toyActuator.actuatorType} ${toyActuator.index + 1}`}
    >
      {(() => {
        switch (toyActuator.actuatorType) {
          case ActuatorType.Vibrate:
            return <VibratorActuatorSettings toyActuator={toyActuator} />;
          default:
            return <UnknownActuatorSettings />;
        }
      })()}
    </SettingsTile>
  );
};

export const VibratorActuatorSettings: React.FC<ToySettingsProps> = ({
  toyActuator,
}) => {
  const vibratorActuator = toyActuator as VibrationActuator;
  const descriptor = `${vibratorActuator.actuatorType}_${vibratorActuator.index}`;
  const [mode, setMode] = useState(vibratorActuator.mode);
  const [min, setMin] = useState(vibratorActuator.minIntensity);
  const [max, setMax] = useState(vibratorActuator.maxIntensity);

  return (
    <div key={`${descriptor}_settings`}>
      <SettingsDescription>
        Select when this component will activate.
      </SettingsDescription>
      <Dropdown
        id={`${descriptor}_mode`}
        value={mode}
        onChange={(value: string) => {
          const newMode = value as ActuatorMode;
          setMode(newMode);
          vibratorActuator.setMode(newMode);
        }}
        options={Object.values(ActuatorMode).map(value => ({
          value,
          label: ActuatorModeLabels[value],
        }))}
      />
      <Space size='medium' />
      <SettingsDescription>
        Change the range of intensity for this component.
      </SettingsDescription>
      <SettingsLabel>From</SettingsLabel>
      <Dropdown
        id={`{${descriptor}_min}`}
        value={`${min}`}
        onChange={(value: string) => {
          const newMin = +value;
          if (newMin > vibratorActuator.maxIntensity) return;
          setMin(newMin);
          vibratorActuator.setMinIntensity(newMin);
        }}
        options={vibratorActuator.intensityRange.map(value => ({
          value: `${value}`,
          label: `${(value * 100).toFixed(0)}%`,
        }))}
      />
      <SettingsLabel>To</SettingsLabel>
      <Dropdown
        id={`{${descriptor}_max}`}
        value={`${max}`}
        onChange={(value: string) => {
          const newMax = +value;
          if (newMax < vibratorActuator.minIntensity) return;
          setMax(newMax);
          vibratorActuator.setMaxIntensity(newMax);
        }}
        options={vibratorActuator.intensityRange.map(value => ({
          value: `${value}`,
          label: `${(value * 100).toFixed(0)}%`,
        }))}
      />
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
