import { readFileSync } from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

interface ElementRow {
  element_id: string;
  part_num: string;
  color_id: string;
  design_id: string;
}

const ELEMENTS_CSV_PATH = process.env.ELEMENTS_CSV_PATH || path.resolve(process.cwd(), 'elements.csv');

const buildKey = (partNum: string, colorCode: string): string => `${partNum}|${colorCode}`;

let elementLookup: Map<string, string> | null = null;

const loadElementLookup = (): Map<string, string> => {
  const raw = readFileSync(ELEMENTS_CSV_PATH, 'utf-8');
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true }) as ElementRow[];

  const lookup = new Map<string, string>();
  for (const row of rows) {
    if (!row.part_num || !row.color_id || !row.element_id) continue;
    const key = buildKey(row.part_num, row.color_id);
    // When a (part_num, color_id) pair maps to multiple element ids, keep the numerically largest.
    const existing = lookup.get(key);
    if (existing === undefined || Number(row.element_id) > Number(existing)) {
      lookup.set(key, row.element_id);
    }
  }

  console.log(`[Elements] Loaded ${lookup.size} element mappings from ${ELEMENTS_CSV_PATH}`);
  return lookup;
};

/** Returns the memoized part/color -> element_id lookup, loading elements.csv on first use. */
const getElementLookup = (): Map<string, string> => {
  if (!elementLookup) elementLookup = loadElementLookup();
  return elementLookup;
};

/**
 * Finds the LEGO element_id for a part, matching the part id (without its ".dat" suffix)
 * against part_num and the color code against color_id in elements.csv.
 */
export const findElementId = (partId: string, colorCode: string): string | undefined => {
  const partNum = partId.replace(/\.dat$/i, '');
  return getElementLookup().get(buildKey(partNum, colorCode));
};
