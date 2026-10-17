import { parameterize } from '@/utility/string';
import { isLensApple, isLensMakeApple } from '@/platforms/apple';

type Lens = { make?: string; model: string };

const CANONICAL_TAMRON_28_200 = 'E 28-200mm F2.8-5.6 A071';

const IPHONE_DEVICE_RE =
  /^iPhone\s+(\d+(?:\s+(?:Pro|Max|Plus|Mini|Air))+)/i;

const is28_200Model = (model: string) => /28[\s.\-]*200/i.test(model);

/** Collapse EXIF duplicates into one sidebar / lens-page group. */
export const canonicalLens = (lens: Lens): Lens => {
  const { make, model } = lens;

  const iphone = model.match(IPHONE_DEVICE_RE);
  if (iphone || (make && isLensMakeApple(make))) {
    const device = model.match(IPHONE_DEVICE_RE);
    if (device) {
      return { make: 'Apple', model: `iPhone ${device[1].trim()}` };
    }
  }

  if (is28_200Model(model)) {
    return { make, model: CANONICAL_TAMRON_28_200 };
  }

  return { make, model };
};

export const lensUsesMergedFilter = (lens: Lens) => {
  const canon = canonicalLens(lens);
  if (
    isLensApple(canon) &&
    IPHONE_DEVICE_RE.test(canon.model) &&
    !/back|front|camera|triple/i.test(canon.model)
  ) {
    return true;
  }
  return is28_200Model(canon.model);
};

type LensWhereParts = {
  clauses: string[]
  values: (string | number)[]
};

// Mirrors db/index.ts parameterizeForDb (cannot import without circular deps).
const parameterizeForDb = (field: string) => {
  const CHARACTERS_TO_REMOVE = [',', '/'];
  const CHARACTERS_TO_REPLACE = ['+', '&', '|', ':', '_', ' '];
  return `REGEXP_REPLACE(
    REGEXP_REPLACE(
      LOWER(TRIM(${field})),
      '[${CHARACTERS_TO_REMOVE.join('')}]', '', 'g'
    ),
    '[${CHARACTERS_TO_REPLACE.join('')}]', '-', 'g'
  )`;
};

/** SQL fragments for filtering photos by a (possibly canonical) lens. */
export const getLensWhereParts = (lens: Lens): LensWhereParts => {
  const canon = canonicalLens(lens);

  if (lensUsesMergedFilter(canon)) {
    if (isLensApple(canon)) {
      return {
        clauses: [
          `${parameterizeForDb('lens_make')}=$1`,
          'LOWER(lens_model) LIKE $2',
        ],
        values: [parameterize('Apple'), `${canon.model.toLowerCase()}%`],
      };
    }
    return {
      clauses: [
        '(lens_model ILIKE $1 OR lens_model ILIKE $2)',
      ],
      values: ['%28-200%', '%28.0-200%'],
    };
  }

  const clauses: string[] = [];
  const values: (string | number)[] = [];
  let index = 1;

  if (lens.make) {
    clauses.push(`${parameterizeForDb('lens_make')}=$${index++}`);
    values.push(parameterize(lens.make));
  }
  clauses.push(`${parameterizeForDb('lens_model')}=$${index++}`);
  values.push(parameterize(lens.model));
  if (!lens.make) {
    clauses.push('(lens_make IS NULL OR trim(lens_make) = \'\')');
  }

  return { clauses, values };
};
