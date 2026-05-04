import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { AttributesType, extractAttributes, generatePersona, getEmbedding, getInstructions } from '../clients';

type SupportedAttributeKey = 'beard' | 'eyebrows' | 'eyes' | 'hair' | 'nose' | 'pants' | 'shirt';

type PersonaAttributes = Partial<Record<SupportedAttributeKey, string>>;

export interface PersonaCreationResult {
  id: string;
  attributes: PersonaAttributes;
  modules: Record<string, string>;
  legoResult: string;
}

export interface ModuleEmbeddingDocument {
  moduleName: string;
  embedding: number[];
}

type ModuleAttributeKey = keyof PersonaCreationResult['modules'];

const SUPPORTED_ATTRIBUTES: SupportedAttributeKey[] = [
  'beard',
  'eyebrows',
  'eyes',
  'hair',
  'nose',
  'pants',
  'shirt',
];

const SUPPORTED_ATTRIBUTE_SET = new Set<string>(SUPPORTED_ATTRIBUTES);

const filterSupportedAttributes = (attributes: AttributesType): PersonaAttributes => {
  const filtered: PersonaAttributes = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (SUPPORTED_ATTRIBUTE_SET.has(key) && typeof value === 'string' && value.trim().length > 0) {
      filtered[key as SupportedAttributeKey] = value;
    }
  }

  return filtered;
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
): string | null => {
  if (!embedding.length) {
    return null;
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

  return bestModuleName || null;
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
  attributeName: string,
  embedding: number[],
): Promise<string | null> => {
  console.log(`[PersonaService] Querying collection "${attributeName}" for matching module`);

  const db = mongoose.connection.db;
  if (!db) {
    console.log(`[PersonaService] No DB instance available. Skipping attribute "${attributeName}"`);
    return null;
  }

  const collectionExists = await db
    .listCollections({ name: attributeName }, { nameOnly: true })
    .hasNext();

  if (!collectionExists) {
    console.log(
      `[PersonaService] Collection "${attributeName}" does not exist. Skipping this attribute`,
    );
    return null;
  }

  const collection = mongoose.connection.collection(attributeName);
  const candidates = (await collection
    .find({ embedding: { $exists: true, $type: 'array' } })
    .toArray()) as Array<Record<string, unknown>>;

  if (!candidates.length) {
    console.log(
      `[PersonaService] Collection "${attributeName}" returned no candidates. Skipping this attribute`,
    );
    return null;
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
  if (!moduleIdentifier) {
    console.log(
      `[PersonaService] Could not find a valid similarity match for "${attributeName}". Skipping this attribute`,
    );
    return null;
  }

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

const normalizeLegoResult = (legoResult: unknown): string => {
  if (Buffer.isBuffer(legoResult)) {
    return legoResult.toString('utf-8');
  }

  if (typeof legoResult === 'string') {
    return legoResult;
  }

  if (legoResult && typeof legoResult === 'object' && 'ldr_file' in legoResult) {
    const ldrFile = (legoResult as { ldr_file?: unknown }).ldr_file;
    if (typeof ldrFile === 'string') {
      return ldrFile;
    }
  }

  throw new Error('[PersonaService] Invalid Lego response: expected Buffer, string, or object.ldr_file');
};

export const generatePersonaInstructions = async (id: string): Promise<Buffer> => {
  const db = mongoose.connection.db;
  if (!db) throw new Error('[PersonaService] No DB instance available');

  const persona = await db.collection('personas').findOne({ _id: new ObjectId(id) });
  if (!persona) throw new Error(`[PersonaService] Persona not found: ${id}`);
  if (!persona.legoFile) throw new Error(`[PersonaService] Persona ${id} has no LDR file`);

  return getInstructions(persona.legoFile as string);
};

export const createPersonaFromImage = async (
  image: { buffer: Buffer; originalname?: string; mimetype?: string },
): Promise<PersonaCreationResult> => {
  try {
    console.log('[PersonaService] Step 1/7 - Sending image to FaceLLM service');
    const rawAttributes = await extractAttributes(image.buffer);
    const attributes = filterSupportedAttributes(rawAttributes);
    console.log('[PersonaService] Step 2/7 - Received and filtered FaceLLM attributes', attributes);
    console.log("[Debug] Attributes from FaceLLM:", attributes);

    const modules: PersonaCreationResult['modules'] = {};
    for (const [attributeName, attributeValue] of Object.entries(attributes)) {
      console.log(
        `[PersonaService] Step 3/7 - Generating embedding for ${attributeName}: "${attributeValue}"`,
      );
      console.log(`[Debug] Processing attribute: ${attributeName} = ${attributeValue}`);

      const embedding = await getEmbedding(attributeValue);
      console.log(`[Debug] Embedding for ${attributeName}:`, embedding?.length);

      if (!embedding.length) {
        console.log(`[PersonaService] Empty embedding for ${attributeName}. Skipping this attribute`);
        continue;
      }

      console.log(`[PersonaService] Step 4/7 - Finding closest module for ${attributeName}`);
      const moduleName = await findClosestModule(attributeName, embedding);
      console.log(`[Debug] Mongo result for ${attributeName}:`, moduleName);
      if (moduleName) {
        modules[attributeName] = moduleName;
      }
    }

    console.log('[PersonaService] Step 5/7 - Sending modules object to Lego service', modules);
    console.log("[Debug]Modules object before sending to Lego service:", modules);
    const legoResponse = await generatePersona(modules);
    const legoResult = normalizeLegoResult(legoResponse);
    console.log('[PersonaService] Step 6/7 - Received response from Lego service');

    const personasCollection = mongoose.connection.collection('personas');
    const insertResult = await personasCollection.insertOne({
      attributes,
      modules,
      legoFile: legoResult,
      createdAt: new Date(),
    });
    console.log('[PersonaService] Step 7/7 - Persona saved to database successfully');

    return {
      id: insertResult.insertedId.toString(),
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
