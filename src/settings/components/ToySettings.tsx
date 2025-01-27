import { ToyClient, type ToyActuator } from '../../toy';
import { ToyActuatorSettings } from './ToyActuatorSettings';
import { SettingsTile } from '../../common';
import { PropsWithChildren } from 'react';
import { SettingsDescription } from '../../common/SettingsDescription';

export interface ToySettingsProps
  extends PropsWithChildren<React.HTMLAttributes<HTMLFieldSetElement>> {
  device: ToyClient;
}

export const ToySettings: React.FC<ToySettingsProps> = ({ device }) => {
  return (
    <li key={device.name}>
      <SettingsTile label={device.name} key={device.name}>
        <SettingsDescription key={device.name}>
          Change the settings for each controllable component on your toy.
        </SettingsDescription>
        {device.actuators.map((a: ToyActuator) => (
          <ToyActuatorSettings toyActuator={a} key={a.index} />
        ))}
      </SettingsTile>
    </li>
  );
};
