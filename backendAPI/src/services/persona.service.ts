import mongoose, { Types } from 'mongoose';
import { parse } from 'csv-parse/sync';
import { LegoColor, Persona, GenerationTask } from '../models';
import { AttributesType, TokenUsage, PersonaModulesInput, extractAttributes, generatePersona, getEmbeddings, getCsv, getImage, getInstructions, rerankAttributes } from '../clients';
import { hexToLab, deltaE, findElementId, savePersonaImage, deletePersonaImage, resolveImageExtension } from '../utils';
import config from '../config/env';

type SupportedAttributeKey = 'beard' | 'eyebrows' | 'eyes' | 'glasses' | 'hair' | 'nose' | 'pants' | 'shirt';

type PersonaAttributes = Partial<Record<SupportedAttributeKey, string>>;

export interface PersonaCreationResult {
  id: string;
  attributes: PersonaAttributes;
  modules: PersonaModulesInput;
  legoResult: string;
  tokens_used: TokenUsage;
}

export interface ModuleEmbeddingDocument {
  moduleName: string;
  desc: string;
  embedding: number[];
  colors: number[];
}

interface ModuleColorCandidate {
  moduleName: string;
  desc: string;
  colorName: string;
  legoColorId: number;
  /** Nearest LDraw color to FaceLLM's `shirt_secondary` hex, from this same module's color pool. Shirt-only. */
  secondaryLegoColorId?: number;
}

const APPROVED_SKIN_TONES = config.APPROVED_SKIN_TONES;
const NUM_COLOR_CANDIDATES = config.NUM_COLOR_CANDIDATES;

const SUPPORTED_ATTRIBUTES: SupportedAttributeKey[] = [
  'beard',
  'eyebrows',
  'eyes',
  'glasses',
  'hair',
  'nose',
  'pants',
  'shirt',
];

const SUPPORTED_ATTRIBUTE_SET = new Set<string>(SUPPORTED_ATTRIBUTES);

// Attributes whose module templates may contain a `SECONDARY` LDR color token (e.g. a tie on a
// shirt, or shoes on pants), each sourced from its own FaceLLM hex field.
const SECONDARY_COLOR_HEX_FIELD: Partial<Record<SupportedAttributeKey, keyof AttributesType>> = {
  shirt: 'shirt_secondary',
  pants: 'pants_secondary',
};

const VECTOR_INDEX_NAME = 'embedding_index';

const findClosestColors = async (
  colorQuery: string,
  colorIds: number[],
  k: number,
): Promise<Array<{ name: string; legoColorId: number }>> => {
  if (!colorIds.length) return [];

  let inputLab: [number, number, number];
  try {
    inputLab = hexToLab(colorQuery);
  } catch {
    throw new Error(`[PersonaService] Invalid color query "${colorQuery}": not a valid hex color`);
  }

  const colors = await LegoColor.find({ legoColorId: { $in: colorIds } }).lean();
  return colors
    .map((c) => ({ name: c.name, legoColorId: c.legoColorId, distance: deltaE(inputLab, c.lab as [number, number, number]) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, k)
    .map(({ name, legoColorId }) => ({ name, legoColorId }));
};

const filterSupportedAttributes = (attributes: AttributesType): PersonaAttributes => {
  const filtered: PersonaAttributes = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (SUPPORTED_ATTRIBUTE_SET.has(key) && typeof value === 'string' && value.trim().length > 0) {
      filtered[key as SupportedAttributeKey] = value;
    }
  }
  return filtered;
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
      $project: { moduleName: 1, desc: 1, embedding: 1, colors: 1 },
    },
  ]).toArray()) as Array<Record<string, unknown>>;

  return results
    .map((doc) => ({
      moduleName: selectModuleIdentifier(doc),
      desc: typeof doc.desc === 'string' ? doc.desc : '',
      embedding: Array.isArray(doc.embedding) ? (doc.embedding as number[]) : [],
      colors: Array.isArray(doc.colors) ? (doc.colors as number[]) : [],
    }))
    .filter((m) => m.moduleName.length > 0);
};

const updateProgress = (jobId: string, actionDescription: string, percentCompleteEstimate: number): void => {
  void GenerationTask.findOneAndUpdate({ jobId }, { actionDescription, percentCompleteEstimate }).catch((err) =>
    console.warn(`[PersonaService] Failed to update progress for jobId=${jobId}:`, err),
  );
};

export class GenerationCancelledError extends Error {
  constructor(jobId: string) {
    super(`[PersonaService] Generation cancelled for jobId=${jobId}`);
    this.name = 'GenerationCancelledError';
  }
}

const throwIfCancelled = async (jobId: string): Promise<void> => {
  const task = await GenerationTask.findOne({ jobId }).select('status').lean();
  if (task?.status === 'CANCELLED') throw new GenerationCancelledError(jobId);
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

export const generatePersonaInstructions = async (id: string, userId: string): Promise<Buffer> => {
  const persona = await Persona.findOne({ _id: id, userId: new Types.ObjectId(userId) }).select('legoFile').lean();
  if (!persona) throw new Error(`[PersonaService] Persona not found: ${id}`);
  if (!persona.legoFile) throw new Error(`[PersonaService] Persona ${id} has no LDR file`);
  return getInstructions(persona.legoFile);
};

export interface LegoPartElement {
  elementId: string;
  quantity: number;
}

export const getLegoPartsJson = async (id: string, userId: string): Promise<LegoPartElement[]> => {
  const persona = await Persona.findOne({ _id: id, userId: new Types.ObjectId(userId) }).select('partsJson').lean();
  if (!persona) throw new Error(`[PersonaService] Persona not found: ${id}`);
  if (!persona.partsJson) throw new Error(`[PersonaService] Persona ${id} has no parts list`);

  const result: LegoPartElement[] = [];
  for (const part of persona.partsJson) {
    const partId = part['Part ID'];
    const colorCode = part['Color Code'];
    if (!partId || colorCode === undefined) continue;

    const elementId = findElementId(partId, colorCode);
    if (!elementId) {
      console.warn(`[PersonaService] No element_id found for part "${partId}" with color code "${colorCode}"`);
      continue;
    }

    const quantity = Number(part['Quantity']);
    result.push({ elementId, quantity: Number.isFinite(quantity) ? quantity : 0 });
  }

  return result;
};

export const createPersonaFromImage = async (
  image: { buffer: Buffer; originalname?: string; mimetype?: string },
  userId: string,
  jobId: string,
): Promise<PersonaCreationResult> => {
  try {
    await throwIfCancelled(jobId);
    console.log('[PersonaService] Step 1/7 - Sending image to FaceLLM service');
    updateProgress(jobId, 'Analyzing your photo...', 5);

    const { attributes: rawResponse, tokens_used: extractTokens } = await extractAttributes(image.buffer);
    console.log('[PersonaService] Step 1/7 - FaceLLM tokens used:', extractTokens);
    const shapeAttributes = filterSupportedAttributes(rawResponse.shapes);
    const colorAttributes = filterSupportedAttributes(rawResponse.colors);
    const colorDescriptionAttributes = filterSupportedAttributes(rawResponse.color_descriptions);
    console.log('[PersonaService] Step 2/7 - Shape attributes from FaceLLM:', shapeAttributes);
    console.log('[PersonaService] Step 2/7 - Color attributes from FaceLLM:', colorAttributes);
    console.log('[PersonaService] Step 2/7 - Color description attributes from FaceLLM:', colorDescriptionAttributes);

    const attributeEntries = Object.entries(shapeAttributes);
    await throwIfCancelled(jobId);
    console.log(`[PersonaService] Step 3/7 - Generating embeddings for ${attributeEntries.length} attributes`);
    updateProgress(jobId, 'Finding matching LEGO parts...', 30);

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

    await throwIfCancelled(jobId);
    console.log('[PersonaService] Step 4a/7 - Finding closest Lego color for skin tone');
    updateProgress(jobId, 'Matching colors...', 45);

    const skinToneHex = rawResponse.colors.skin_tone ?? '';
    let skinToneColorId: number = 19;
    if (skinToneHex) {
      const skinToneColors = await findClosestColors(skinToneHex, APPROVED_SKIN_TONES, 1);
      if (skinToneColors.length) {
        skinToneColorId = skinToneColors[0].legoColorId;
        console.log(`[PersonaService] Step 4a/7 - Skin tone: "${skinToneColors[0].name}" (id: ${skinToneColorId})`);
      } else {
        console.log(`[PersonaService] Step 4a/7 - Could not find closest color for skin tone hex "${skinToneHex}", defaulting to id 19`);
      }
    } else {
      console.log('[PersonaService] Step 4a/7 - No skin tone hex provided, defaulting to id 19');
    }

    console.log('[PersonaService] Step 4b/7 - Finding closest colors for each candidate module');
    updateProgress(jobId, 'Matching colors...', 55);

    const topCandidatesPerAttribute: Record<string, ModuleColorCandidate[]> = {};
    await Promise.all(
      Object.entries(topModulesPerAttribute).map(async ([attributeName, topModules]) => {
        const colorQuery = colorAttributes[attributeName as SupportedAttributeKey] ?? '';
        const secondaryHexField = SECONDARY_COLOR_HEX_FIELD[attributeName as SupportedAttributeKey];
        const secondaryHex = secondaryHexField ? (rawResponse.colors[secondaryHexField] ?? '') : '';
        const candidates: ModuleColorCandidate[] = [];
        for (const module of topModules) {
          console.log(`[PersonaService] Finding closest colors for attribute "${attributeName}", module colors "${module.colors}" with color query "${colorQuery}"`);
          const filteredColors = module.colors.filter((id) => id !== skinToneColorId);
          const closestColors = await findClosestColors(colorQuery, filteredColors, NUM_COLOR_CANDIDATES);

          let secondaryLegoColorId: number | undefined;
          if (secondaryHex) {
            const closestSecondary = await findClosestColors(secondaryHex, filteredColors, 1);
            if (closestSecondary.length) {
              secondaryLegoColorId = closestSecondary[0].legoColorId;
              console.log(`[PersonaService] ${attributeName} - Module "${module.moduleName}" secondary color: "${closestSecondary[0].name}" (id: ${secondaryLegoColorId})`);
            }
          }

          for (const color of closestColors) {
            candidates.push({ moduleName: module.moduleName, desc: module.desc, colorName: color.name, legoColorId: color.legoColorId, secondaryLegoColorId });
          }
          console.log(`[PersonaService] ${attributeName} - Module "${module.moduleName}" candidates:`, candidates);
        }
        if (candidates.length) topCandidatesPerAttribute[attributeName] = candidates;
      }),
    );

    await throwIfCancelled(jobId);
    console.log('[PersonaService] Step 5/7 - Reranking candidates with FaceLLM');
    updateProgress(jobId, 'Selecting the best matches...', 70);

    const rerankFeatures: Record<string, { description: string; candidates: string[] }> = {};
    for (const [attributeName, candidates] of Object.entries(topCandidatesPerAttribute)) {
      const description = `${colorDescriptionAttributes[attributeName as SupportedAttributeKey] ?? ''} ${shapeAttributes[attributeName as SupportedAttributeKey] ?? ''}`.trim();
      const candidateStrings = candidates.map((c) => `${c.colorName} ${c.desc}`);
      console.log(`[PersonaService] ${attributeName}: "${description}" → [${candidateStrings.map((c) => `"${c}"`).join(', ')}]`);
      rerankFeatures[attributeName] = { description, candidates: candidateStrings };
    }
    const { result: rerankResult, tokens_used: rerankTokens } = await rerankAttributes(rerankFeatures);
    console.log('[PersonaService] Step 5/7 - FaceLLM rerank tokens used:', rerankTokens);

    const modules: PersonaModulesInput = {};
    for (const [attributeName, candidates] of Object.entries(topCandidatesPerAttribute)) {
      const result = rerankResult[attributeName];
      if (result !== undefined) {
        const selected = candidates[result.index];
        if (selected) {
          console.log(`[PersonaService] ${attributeName}: "${selected.moduleName}" color "${selected.colorName}" (rerank index ${result.index})`);
          modules[attributeName] = { file_name: selected.moduleName, color: selected.legoColorId };
          if (selected.secondaryLegoColorId !== undefined) {
            modules[attributeName].secondary_color = selected.secondaryLegoColorId;
          }
        }
      }
    }

    await throwIfCancelled(jobId);
    console.log('[PersonaService] Step 6/7 - Sending modules to Lego service', modules);
    console.log('[PersonaService] Step 6/7 - Lego request payload summary', {
      jobId,
      modulesCount: Object.keys(modules).length,
      moduleKeys: Object.keys(modules),
      skinToneColorId,
    });
    updateProgress(jobId, 'Building your LEGO model...', 80);

    const legoResponse = await generatePersona(modules, skinToneColorId);
    console.log('[PersonaService] Step 6/7 - Raw Lego response type', {
      jobId,
      isBuffer: Buffer.isBuffer(legoResponse),
      type: typeof legoResponse,
      hasLdrFileField: typeof legoResponse === 'object' && legoResponse !== null && 'ldr_file' in legoResponse,
    });
    const legoResult = normalizeLegoResult(legoResponse);
    console.log('[PersonaService] Step 6/7 - Received response from Lego service', {
      jobId,
      legoResultLength: legoResult.length,
      legoResultPreview: legoResult.slice(0, 120),
    });

    console.log('[PersonaService] Step 6a/7 - Fetching image and parts CSV from Lego service');
    updateProgress(jobId, 'Rendering preview image...', 90);

    const personaImage = await getImage(legoResult);
    const personaCsvRaw = await getCsv(legoResult);
    console.log('[PersonaService] Step 6a/7 - Lego image/csv raw sizes', {
      jobId,
      imageBytes: personaImage.byteLength,
      csvChars: personaCsvRaw.length,
    });
    const personaPartsJson = parse(personaCsvRaw, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
    console.log(`[PersonaService] Step 6a/7 - Image received, CSV parsed (${personaPartsJson.length} rows)`);

    await throwIfCancelled(jobId);
    // Persist images to the public folder under a unique id derived from the persona id.
    const personaId = new Types.ObjectId();
    const originalExt = resolveImageExtension(image.mimetype, image.originalname);
    const personaImageName = `${personaId.toString()}-persona.png`;
    const originalImageName = `${personaId.toString()}-original.${originalExt}`;

    try {
      await savePersonaImage(personaImageName, personaImage);
      await savePersonaImage(originalImageName, image.buffer);
    } catch (fileError) {
      // Roll back any partially written files so we don't leave orphans behind.
      await Promise.all([deletePersonaImage(personaImageName), deletePersonaImage(originalImageName)]);
      throw fileError;
    }

    let persona;
    try {
      persona = await Persona.create({
        _id: personaId,
        userId: new Types.ObjectId(userId),
        attributes: shapeAttributes,
        modules,
        skinTone: skinToneColorId,
        legoFile: legoResult,
        personaImage: personaImageName,
        originalImage: originalImageName,
        partsJson: personaPartsJson,
      });
    } catch (dbError) {
      // The DB write failed, so the files on disk would be orphaned. Clean them up.
      await Promise.all([deletePersonaImage(personaImageName), deletePersonaImage(originalImageName)]);
      throw dbError;
    }
    updateProgress(jobId, 'Saving your persona...', 99);
    console.log('[PersonaService] Step 7/7 - Persona saved to database', {
      jobId,
      personaId: persona._id.toString(),
      storedOriginalImage: Boolean(persona.originalImage),
      storedGeneratedImage: Boolean(persona.personaImage),
      partsRows: personaPartsJson.length,
    });

    const tokens_used: TokenUsage = {
      input: extractTokens.input + rerankTokens.input,
      output: extractTokens.output + rerankTokens.output,
      total: extractTokens.total + rerankTokens.total,
    };
    console.log('[PersonaService] Total LLM tokens used:', tokens_used);

    return { id: persona._id.toString(), attributes: shapeAttributes, modules, legoResult, tokens_used };
  } catch (error) {
    if (error instanceof GenerationCancelledError) {
      console.log(`[PersonaService] Pipeline stopped: generation cancelled for jobId=${jobId}`);
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[PersonaService] Persona creation pipeline failed', {
      jobId,
      userId,
      message,
      stack: error instanceof Error ? error.stack : undefined,
      error,
    });
    throw new Error(`[PersonaService] Persona creation failed: ${message}`);
  }
};

export const getPersonasByUser = async (userId: string) => {
  try {
    return await Persona.find({ userId: new Types.ObjectId(userId) })
      .select('attributes modules createdAt personaImage originalImage')
      .lean();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`[PersonaService] Failed to get personas: ${message}`);
  }
};

export const deletePersonaByIdForUser = async (
  personaId: string,
  userId: string,
): Promise<boolean> => {
  const persona = await Persona.findOneAndDelete({ _id: new Types.ObjectId(personaId), userId: new Types.ObjectId(userId) })
    .select('personaImage originalImage')
    .lean();

  if (!persona) {
    return false;
  }

  // Remove the persona's image files from the public folder. Best-effort: the document is already deleted.
  await Promise.all([
    deletePersonaImage(persona.personaImage),
    deletePersonaImage(persona.originalImage),
  ]).catch((cleanupError) => {
    console.warn(`[PersonaService] Failed to delete image files for persona ${personaId}:`, cleanupError);
  });

  return true;
};
