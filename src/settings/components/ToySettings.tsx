import { ToyClient, type ToyActuator } from '../../toy';
import { ToyActuatorSettings } from './ToyActuatorSettings';
import { Fields } from '../../common';
import { PropsWithChildren } from 'react';
import { SettingsDescription } from '../../common/SettingsDescription';

export interface ToySettingsProps
  extends PropsWithChildren<React.HTMLAttributes<HTMLFieldSetElement>> {
  device: ToyClient;
}

export const ToySettings: React.FC<ToySettingsProps> = ({ device }) => {
  return (
    <li key={`${device.name}_${device.index}_Item`}>
      <Fields label={device.name} key={`${device.name}_${device.index}_Field`}>
        <SettingsDescription key={`${device.name}_${device.index}_Description`}>
          Change the settings for each controllable component on your toy.
        </SettingsDescription>
        {device.actuators.map((a: ToyActuator) => (
          <ToyActuatorSettings toyActuator={a} key={`${device.name}_${device.index}_${a.actuatorType}_${a.index}`} />
        ))}
      </Fields>
    </li>
  );
};
