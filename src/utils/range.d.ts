export interface NumberRange {
  max: number;
  min: number;
}

export function inRange(value: number, range: NumberRange): boolean {
  return value >= range.min && value <= range.max;
}
