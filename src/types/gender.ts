export enum PlayerGender {
  man = 'man',
  woman = 'woman',
  other = 'other',
}

export const PlayerGenderLabels: Record<PlayerGender, string> = {
  man: 'Man',
  woman: 'Woman',
  other: 'Other',
};

export const PlayerGenderDescriptions: Record<PlayerGender, string> = {
  man: 'Refer to you as male (he/him/boy)',
  woman: 'Refer to you as female (she/her/girl)',
  other: 'Refer to you neutrally (they/them/pup)',
};
