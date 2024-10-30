import { Vibrator } from '../../utils/vibrator';
import { ToyActuatorSettings } from './ToyActuatorSettings';
import { SettingsTile } from '../../common';
import { PropsWithChildren } from 'react';
import { type ToyActuator } from '../../utils';
import { SettingsDescription } from '../../common/SettingsDescription';

export interface ToySettingsProps
  extends PropsWithChildren<React.HTMLAttributes<HTMLFieldSetElement>> {
  key: number;
  device: Vibrator;
}

export const ToySettings: React.FC<ToySettingsProps> = ({ key, device }) => {
  return (
    <li key={key}>
      <SettingsTile label={device.name}>
        <SettingsDescription>
          Change the settings for each controllable component on your toy.
        </SettingsDescription>
        {device.actuators.map((a: ToyActuator) => (
          <ToyActuatorSettings toyActuator={a} />
        ))}
      </SettingsTile>
    </li>
  );
};
