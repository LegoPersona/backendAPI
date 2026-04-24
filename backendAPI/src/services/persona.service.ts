import mongoose from 'mongoose';
import { AttributesType, extractAttributes, generatePersona, getEmbedding } from '../clients';

export interface PersonaCreationResult {
  attributes: AttributesType;
  modules: {
    hair_color: string;
    skin_tone: string;
    glasses: string;
    beard: string;
  };
  legoResult: string | Buffer;
}

export interface ModuleEmbeddingDocument {
  moduleName: string;
  embedding: number[];
}

type ModuleAttributeKey = keyof PersonaCreationResult['modules'];

const MODULE_ATTRIBUTE_KEYS: ModuleAttributeKey[] = ['hair_color', 'skin_tone', 'glasses', 'beard'];

const getAttributeValueForModule = (
  attributes: AttributesType,
  key: ModuleAttributeKey,
): string => {
  const aliases: Record<ModuleAttributeKey, Array<keyof AttributesType>> = {
    hair_color: ['hair_color', 'hair'],
    skin_tone: ['skin_tone', 'nose'],
    glasses: ['glasses', 'eyes'],
    beard: ['beard'],
  };

  for (const alias of aliases[key]) {
    const value = attributes[alias];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  throw new Error(`[PersonaService] Missing FaceLLM attribute for ${key}`);
};

export const cosineSimilarity = (vectorA: number[], vectorB: number[]): number => {
  if (!vectorA.length || !vectorB.length || vectorA.length !== vectorB.length) {
    return -1;
  }

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

  if (magnitudeA === 0 || magnitudeB === 0) {
    return -1;
  }

  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
};

export const findBestModuleMatch = (
  embedding: number[],
  modules: ModuleEmbeddingDocument[],
): string => {
  if (!embedding.length) {
    throw new Error('[PersonaService] Input embedding vector is empty.');
  }

  let bestModuleName = '';
  let bestScore = -1;

  for (const module of modules) {
    if (
      !module.moduleName
      || !Array.isArray(module.embedding)
      || !module.embedding.every((value) => typeof value === 'number' && Number.isFinite(value))
    ) {
      continue;
    }

    const score = cosineSimilarity(embedding, module.embedding);
    if (score > bestScore) {
      bestScore = score;
      bestModuleName = module.moduleName;
    }
  }

  if (!bestModuleName) {
    throw new Error('[PersonaService] No valid module embeddings were found for similarity search.');
  }

  return bestModuleName;
};

const selectModuleIdentifier = (moduleDoc: Record<string, unknown>): string => {
  const preferredKeys = ['moduleName', 'name', 'value', 'label', 'code'];

  for (const key of preferredKeys) {
    const value = moduleDoc[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return String(moduleDoc._id || 'unknown-module');
};

const findClosestModule = async (
  attributeName: ModuleAttributeKey,
  embedding: number[],
): Promise<string> => {
  console.log(`[PersonaService] Querying collection "${attributeName}" for matching module`);

  const collection = mongoose.connection.collection(attributeName);
  const candidates = (await collection
    .find({ embedding: { $exists: true, $type: 'array' } })
    .toArray()) as Array<Record<string, unknown>>;

  if (!candidates.length) {
    throw new Error(
      `[PersonaService] No module candidates found in collection "${attributeName}"`,
    );
  }

  const normalizedCandidates = candidates
    .map((candidate) => {
      const moduleName = selectModuleIdentifier(candidate);
      const candidateEmbedding = Array.isArray(candidate.embedding)
        ? (candidate.embedding as number[])
        : [];

      return {
        moduleName,
        embedding: candidateEmbedding,
      };
    })
    .filter((candidate) => candidate.moduleName.length > 0);

  const moduleIdentifier = findBestModuleMatch(embedding, normalizedCandidates);
  const selectedCandidate = normalizedCandidates.find(
    (candidate) => candidate.moduleName === moduleIdentifier,
  );
  const bestScore = selectedCandidate
    ? cosineSimilarity(embedding, selectedCandidate.embedding)
    : -1;

  console.log(
    `[PersonaService] Selected module for ${attributeName}: ${moduleIdentifier} (score=${bestScore.toFixed(4)})`,
  );

  return moduleIdentifier;
};

export const createPersonaFromImage = async (
  image: { buffer: Buffer; originalname?: string; mimetype?: string },
): Promise<PersonaCreationResult> => {
  try {
    console.log('[PersonaService] Step 1/7 - Sending image to FaceLLM service');
    const attributes = await extractAttributes(image.buffer);
    console.log('[PersonaService] Step 2/7 - Received attributes from FaceLLM', attributes);

    const embeddings = {} as Record<ModuleAttributeKey, number[]>;
    for (const key of MODULE_ATTRIBUTE_KEYS) {
      const sourceValue = getAttributeValueForModule(attributes, key);
      console.log(`[PersonaService] Step 3/7 - Generating embedding for ${key}: "${sourceValue}"`);
      embeddings[key] = await getEmbedding(sourceValue);
    }

    const modules = {} as PersonaCreationResult['modules'];
    for (const key of MODULE_ATTRIBUTE_KEYS) {
      console.log(`[PersonaService] Step 4/7 - Finding closest module for ${key}`);
      modules[key] = await findClosestModule(key, embeddings[key]);
    }

    console.log('[PersonaService] Step 5/7 - Sending modules object to Lego service', modules);
    const legoResult = await generatePersona(modules);
    console.log('[PersonaService] Step 6/7 - Received response from Lego service');

    console.log('[PersonaService] Step 7/7 - Persona pipeline completed successfully');
    return {
      attributes,
      modules,
      legoResult,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[PersonaService] Persona creation pipeline failed:', error);
    throw new Error(`[PersonaService] Persona creation failed: ${message}`);
  }
};
