import chroma from 'chroma-js';

export const hexToLab = (hex: string): [number, number, number] => {
  const [L, a, b] = chroma(hex).lab();
  return [L, a, b];
};

export const deltaE = (lab1: [number, number, number], lab2: [number, number, number]): number =>
  Math.sqrt(
    Math.pow(lab1[0] - lab2[0], 2) +
    Math.pow(lab1[1] - lab2[1], 2) +
    Math.pow(lab1[2] - lab2[2], 2),
  );
