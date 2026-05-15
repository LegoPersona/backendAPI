export const cosineSimilarity = (vectorA: number[], vectorB: number[]): number => {
  if (!vectorA.length || !vectorB.length || vectorA.length !== vectorB.length) return -1;

  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let index = 0; index < vectorA.length; index += 1) {
    const a = vectorA[index];
    const b = vectorB[index];
    dot += a * b;
    magnitudeA += a * a;
    magnitudeB += b * b;
  }

  if (magnitudeA === 0 || magnitudeB === 0) return -1;
  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
};
