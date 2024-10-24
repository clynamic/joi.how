// import { useActuatorSettings } from '../../utils'
import { ToyActuator } from '../../utils/toyactuator';
import { PropsWithChildren } from 'react';
// import { Vibrator } from '../../utils/vibrator';
import { SettingsTile } from '../../common';
import { SettingsDescription } from '../../common/SettingsDescription';

export interface ToySettingsProps
  extends PropsWithChildren<React.HTMLAttributes<HTMLFieldSetElement>> {
  toyActuator: ToyActuator;
}

export const ToyActuatorSettings: React.FC<ToySettingsProps> = ({
  toyActuator,
}) => {
  const actuatorType = toyActuator.actuatorType;
  const index = toyActuator.index;

  return (
    <SettingsTile label={`${actuatorType} ${index + 1}`}>
      <SettingsDescription>
        This component is not yet supported.
      </SettingsDescription>
    </SettingsTile>
  );
};
