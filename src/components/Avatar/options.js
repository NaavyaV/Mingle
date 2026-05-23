export const SKIN_TONES = [
  { id: 'porcelain', color: '#F6D7C2' },
  { id: 'light', color: '#EFC1A1' },
  { id: 'warm', color: '#D9A07A' },
  { id: 'tan', color: '#B97E5C' },
  { id: 'deep', color: '#8A553B' },
  { id: 'rich', color: '#5E3724' },
];

export const HAIR_COLORS = [
  { id: 'black', color: '#1B1B1F' },
  { id: 'brown', color: '#5A3A22' },
  { id: 'auburn', color: '#8B3A2A' },
  { id: 'blonde', color: '#E8C77C' },
  { id: 'gray', color: '#A6A6A6' },
  { id: 'pink', color: '#E07AB1' },
];

export const CLOTHING_COLORS = [
  { id: 'navy', color: '#4B5D9A' },
  { id: 'coral', color: '#FF7A59' },
  { id: 'gold', color: '#FFC857' },
  { id: 'forest', color: '#2E9E6A' },
  { id: 'rose', color: '#E07AB1' },
  { id: 'graphite', color: '#2A2F3A' },
];

export const GENDERS = [
  { id: 'female', label: '♀' },
  { id: 'male', label: '♂' },
];

export const HAIR_STYLES_BY_GENDER = {
  male: [
    { id: 'short', label: 'Short' },
    { id: 'buzz', label: 'Buzz' },
    { id: 'quiff', label: 'Quiff' },
    { id: 'curly', label: 'Curly' },
    { id: 'fade', label: 'Fade' },
  ],
  female: [
    { id: 'long', label: 'Long' },
    { id: 'bob', label: 'Bob' },
    { id: 'bun', label: 'Bun' },
    { id: 'ponytail', label: 'Ponytail' },
    { id: 'wavy', label: 'Wavy' },
  ],
};

export const DEFAULT_HAIR_BY_GENDER = {
  male: 'short',
  female: 'long',
};

export const DEFAULT_AVATAR = {
  skin: 'warm',
  hairColor: 'brown',
  hairStyle: 'long',
  clothing: 'navy',
  gender: 'female',
};

export function getColorById(list, id) {
  return list.find((x) => x.id === id)?.color || list[0].color;
}

export function isHairStyleValid(gender, styleId) {
  const list = HAIR_STYLES_BY_GENDER[gender] || [];
  return list.some((s) => s.id === styleId);
}

export function ensureValidHair(avatar) {
  if (!isHairStyleValid(avatar.gender, avatar.hairStyle)) {
    return { ...avatar, hairStyle: DEFAULT_HAIR_BY_GENDER[avatar.gender] };
  }
  return avatar;
}
