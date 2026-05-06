import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { AttributesType, extractAttributes, generatePersona, getEmbeddings, getInstructions, rerankAttributes } from '../clients';

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
  desc: string;
  embedding: number[];
}

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

const VECTOR_INDEX_NAME = 'embedding_index';

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

const selectModuleIdentifier = (moduleDoc: Record<string, unknown>): string => {
  const preferredKeys = ['moduleName', 'name', 'value', 'label', 'code'];
  for (const key of preferredKeys) {
    const value = moduleDoc[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return String(moduleDoc._id || 'unknown-module');
};

const findTopModules = async (
  attributeName: string,
  embedding: number[],
  k: number,
): Promise<ModuleEmbeddingDocument[]> => {
  const db = mongoose.connection.db;
  if (!db) return [];

  const collectionExists = await db
    .listCollections({ name: attributeName }, { nameOnly: true })
    .hasNext();
  if (!collectionExists) {
    console.log(`[PersonaService] Collection "${attributeName}" does not exist. Skipping`);
    return [];
  }

  const collection = mongoose.connection.collection(attributeName);

  const results = (await collection.aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: 'embedding',
        queryVector: embedding,
        numCandidates: Math.max(20, k * 10),
        limit: k,
      },
    } as object,
    {
      $project: { moduleName: 1, desc: 1, embedding: 1 },
    },
  ]).toArray()) as Array<Record<string, unknown>>;

  return results
    .map((doc) => ({
      moduleName: selectModuleIdentifier(doc),
      desc: typeof doc.desc === 'string' ? doc.desc : '',
      embedding: Array.isArray(doc.embedding) ? (doc.embedding as number[]) : [],
    }))
    .filter((m) => m.moduleName.length > 0);
};

const normalizeLegoResult = (legoResult: unknown): string => {
  if (Buffer.isBuffer(legoResult)) return legoResult.toString('utf-8');
  if (typeof legoResult === 'string') return legoResult;

  if (legoResult && typeof legoResult === 'object' && 'ldr_file' in legoResult) {
    const ldrFile = (legoResult as { ldr_file?: unknown }).ldr_file;
    if (typeof ldrFile === 'string') return ldrFile;
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
    console.log('[PersonaService] Step 2/7 - Attributes from FaceLLM:', attributes);

    const attributeEntries = Object.entries(attributes);
    console.log(`[PersonaService] Step 3/7 - Generating embeddings for ${attributeEntries.length} attributes`);
    const embeddings = await getEmbeddings(attributeEntries.map(([, v]) => v));

    console.log('[PersonaService] Step 4/7 - Running vector search (top 3) for each attribute');
    const topModulesPerAttribute: Record<string, ModuleEmbeddingDocument[]> = {};
    await Promise.all(
      attributeEntries.map(async ([attributeName], i) => {
        const embedding = embeddings[i];
        if (!embedding?.length) return;
        const top = await findTopModules(attributeName, embedding, 3);
        if (top.length) topModulesPerAttribute[attributeName] = top;
      }),
    );

    console.log('[PersonaService] Step 5/7 - Reranking candidates with FaceLLM');
    const rerankFeatures: Record<string, { description: string; candidates: string[] }> = {};
    for (const [attributeName, topModules] of Object.entries(topModulesPerAttribute)) {
      const description = attributes[attributeName as SupportedAttributeKey] ?? '';
      const candidates = topModules.map((m) => m.desc);
      console.log(`[PersonaService] ${attributeName}: "${description}" → [${candidates.map((c) => `"${c}"`).join(', ')}]`);
      rerankFeatures[attributeName] = { description, candidates };
    }
    const rerankResult = await rerankAttributes(rerankFeatures);

    const modules: PersonaCreationResult['modules'] = {};
    for (const [attributeName, topModules] of Object.entries(topModulesPerAttribute)) {
      const result = rerankResult[attributeName];
      if (result !== undefined) {
        const selected = topModules[result.index];
        if (selected) {
          console.log(`[PersonaService] ${attributeName}: "${selected.moduleName}" (rerank index ${result.index})`);
          modules[attributeName] = selected.moduleName;
        }
      }
    }

    console.log('[PersonaService] Step 6/7 - Sending modules to Lego service', modules);
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
    console.log('[PersonaService] Step 7/7 - Persona saved to database');

    return { id: insertResult.insertedId.toString(), attributes, modules, legoResult };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[PersonaService] Persona creation pipeline failed:', error);
    throw new Error(`[PersonaService] Persona creation failed: ${message}`);
  }
};
