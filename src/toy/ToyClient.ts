import { type ButtplugClientDevice, ActuatorType } from 'buttplug';
import {
  ToyActuator,
  VibrationActuator,
  LinearActuator,
  OscillateActuator,
} from './ToyActuator';
import { StrokeDirection } from '../game/plugins/stroke';

let index = 0;

export class ToyClient {
  actuators: ToyActuator[] = [];
  index: number = 0;

  constructor(private readonly device: ButtplugClientDevice) {
    device.vibrateAttributes.forEach(
      attribute =>
        (this.actuators = [...this.actuators, new VibrationActuator(attribute)])
    );
    device.linearAttributes.forEach(
      attribute =>
        (this.actuators = [...this.actuators, new LinearActuator(attribute)])
    );
    device.oscillateAttributes.forEach(
      attribute =>
        (this.actuators = [...this.actuators, new OscillateActuator(attribute)])
    );
    device.rotateAttributes.forEach(
      attribute =>
        (this.actuators = [...this.actuators, new ToyActuator(attribute)])
    );
    this.index = index++;
  }

  async actuate(
    stroke: StrokeDirection,
    intensity: number,
    pace: number,
    maxPace: number
  ): Promise<void> {
    const vibrationArray: number[] = [];
    const linearArray: [number, number][] = [];
    const oscillateArray: number[] = [];
    this.actuators.forEach(actuator => {
      switch (actuator.actuatorType) {
        case ActuatorType.Vibrate:
          vibrationArray.push(
            actuator.getOutput?.(stroke, intensity, pace) as number
          );
          break;
        case ActuatorType.Position:
          linearArray.push(
            actuator.getOutput?.(stroke, intensity, pace) as [number, number]
          );
          break;
        case ActuatorType.Oscillate:
          oscillateArray.push(
            actuator.getOutput?.(stroke, intensity, pace / maxPace) as number
          );
          break;
        default:
          break;
      }
    });
    await Promise.all([
      vibrationArray.length > 0 && this.device.vibrate(vibrationArray),
      linearArray.length > 0 && this.device.linear(linearArray),
      oscillateArray.length > 0 && this.device.oscillate(oscillateArray),
    ]);
  }

  async setVibration(strength: number): Promise<void> {
    const vibrationArray: number[] = [];
    this.actuators.forEach(actuator => {
      if (actuator.actuatorType !== ActuatorType.Vibrate) return;
      vibrationArray.push((actuator as VibrationActuator).mapToRange(strength));
    });
    if (vibrationArray.length === 0) return;
    await this.device.vibrate(vibrationArray);
  }

  async stop(): Promise<void> {
    await this.device.stop();
  }

  get name(): string {
    return this.device.name;
  }

  get deviceIndex(): number {
    return this.device.index;
  }
}
