export const convertWeight = (weight: number, from: 'kg' | 'lbs', to: 'kg' | 'lbs'): number => {
  if (from === to) return weight;
  if (from === 'kg' && to === 'lbs') return weight * 2.20462;
  return weight / 2.20462;
};

export const convertLength = (length: number, from: 'cm' | 'in', to: 'cm' | 'in'): number => {
  if (from === to) return length;
  if (from === 'cm' && to === 'in') return length / 2.54;
  return length * 2.54;
};

export const formatWeight = (weight: number, unit: 'kg' | 'lbs'): string => {
  return `${weight.toFixed(1)} ${unit}`;
};

export const formatLength = (length: number, unit: 'cm' | 'in'): string => {
  return `${length.toFixed(1)} ${unit}`;
};