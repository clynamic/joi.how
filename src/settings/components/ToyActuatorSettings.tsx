// import { useActuatorSettings } from '../../utils'
import {
  ToyActuator,
  VibrationActuator,
  ActuatorMode,
  ActuatorModeLabels,
} from '../../utils/toyactuator';
import { PropsWithChildren, useState } from 'react';
// import { Vibrator } from '../../utils/vibrator';
import { SettingsTile } from '../../common';
import { SettingsDescription } from '../../common/SettingsDescription';
import { Dropdown } from '../../common/Dropdown';
import { ActuatorType } from 'buttplug';

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
