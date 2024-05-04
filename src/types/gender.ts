export enum PlayerGender {
  male = 'male',
  female = 'female',
  other = 'other',
}

export const PlayerGenderLabels: Record<PlayerGender, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

export const PlayerGenderDescriptions: Record<PlayerGender, string> = {
  male: 'Refer to you as male (he/him/boy)',
  female: 'Refer to you as female (she/her/girl)',
  other: 'Refer to you neutrally (they/them/pup)',
};
