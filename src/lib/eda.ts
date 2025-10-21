export type InferredType = 'number' | 'integer' | 'boolean' | 'datetime' | 'string' | 'null' | 'unknown';

export interface FieldSummary {
  field: string;
  type: InferredType;
  missingCount: number;
  missingPercent: number;
  cardinality?: number;
  sampleValues: any[];
  numeric?: {
    count: number;
    min: number;
    max: number;
    mean: number;
    median: number;
    p25: number;
    p75: number;
    stddev: number;
  };
  categorical?: Array<{ value: string; count: number }>;
}

export interface EdaResult {
  rowCount: number;
  fields: FieldSummary[];
  detectedTimeField?: string;
  correlation?: {
    fields: string[];
    matrix: number[][]; // pearson r in [-1,1]
    sampled: number;
  };
}

function tryParseNumber(value: any): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isIntegerLike(n: number): boolean {
  return Number.isInteger(n);
}

function tryParseBoolean(value: any): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'true' || v === 'yes' || v === '1') return true;
    if (v === 'false' || v === 'no' || v === '0') return false;
  }
  return null;
}

function tryParseDate(value: any): Date | null {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function inferFieldType(values: any[]): InferredType {
  let sawNumber = false;
  let sawInteger = true;
  let sawBoolean = false;
  let sawDatetime = false;
  let sawString = false;
  let sawNonNull = false;

  for (const v of values) {
    if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) continue;
    sawNonNull = true;
    const num = tryParseNumber(v);
    if (num !== null) {
      sawNumber = true;
      if (!isIntegerLike(num)) sawInteger = false;
      continue;
    }
    const bool = tryParseBoolean(v);
    if (bool !== null) {
      sawBoolean = true;
      continue;
    }
    const dt = tryParseDate(v);
    if (dt) {
      sawDatetime = true;
      continue;
    }
    sawString = true;
  }

  if (!sawNonNull) return 'null';
  if (sawNumber && !sawString && !sawBoolean && !sawDatetime) return sawInteger ? 'integer' : 'number';
  if (sawBoolean && !sawString && !sawNumber && !sawDatetime) return 'boolean';
  if (sawDatetime && !sawString && !sawNumber && !sawBoolean) return 'datetime';
  return 'string';
}

function quantiles(sortedNumbers: number[], q: number): number {
  if (sortedNumbers.length === 0) return NaN;
  const pos = (sortedNumbers.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sortedNumbers[base + 1] !== undefined) {
    return sortedNumbers[base] + rest * (sortedNumbers[base + 1] - sortedNumbers[base]);
  } else {
    return sortedNumbers[base];
  }
}

function stdDev(numbers: number[], mean: number): number {
  if (numbers.length <= 1) return 0;
  const variance = numbers.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) / (numbers.length - 1);
  return Math.sqrt(variance);
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return NaN;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
  for (let i = 0; i < n; i++) {
    const xi = x[i];
    const yi = y[i];
    sumX += xi; sumY += yi; sumXY += xi * yi; sumXX += xi * xi; sumYY += yi * yi;
  }
  const cov = sumXY - (sumX * sumY) / n;
  const varX = sumXX - (sumX * sumX) / n;
  const varY = sumYY - (sumY * sumY) / n;
  const denom = Math.sqrt(varX * varY);
  return denom === 0 ? NaN : cov / denom;
}

export function analyzeDataset(rows: any[]): EdaResult {
  if (!Array.isArray(rows)) return { rowCount: 0, fields: [] };
  const rowCount = rows.length;
  const fieldNames = Array.from(
    rows.reduce((set: Set<string>, row: any) => {
      if (row && typeof row === 'object') {
        Object.keys(row).forEach((k) => set.add(k));
      }
      return set;
    }, new Set<string>())
  );

  const fields: FieldSummary[] = [];
  let detectedTimeField: string | undefined = undefined;

  for (const field of fieldNames) {
    const values = rows.map((r) => (r ? r[field] : undefined));
    const nonNullValues = values.filter((v) => v !== null && v !== undefined && !(typeof v === 'string' && v.trim() === ''));
    const missingCount = rowCount - nonNullValues.length;
    const missingPercent = rowCount === 0 ? 0 : (missingCount / rowCount) * 100;

    const inferredType = inferFieldType(nonNullValues);

    const summary: FieldSummary = {
      field,
      type: inferredType,
      missingCount,
      missingPercent,
      sampleValues: nonNullValues.slice(0, 5),
    };

    if (inferredType === 'number' || inferredType === 'integer') {
      const nums = nonNullValues.map((v) => tryParseNumber(v) as number).filter((n) => Number.isFinite(n));
      const sorted = [...nums].sort((a, b) => a - b);
      const count = nums.length;
      const min = sorted[0] ?? NaN;
      const max = sorted[sorted.length - 1] ?? NaN;
      const mean = count ? nums.reduce((a, b) => a + b, 0) / count : NaN;
      const median = quantiles(sorted, 0.5);
      const p25 = quantiles(sorted, 0.25);
      const p75 = quantiles(sorted, 0.75);
      const sd = stdDev(nums, mean);
      summary.numeric = { count, min, max, mean, median, p25, p75, stddev: sd };
    }

    if (inferredType === 'string' || inferredType === 'boolean' || inferredType === 'integer') {
      const freq = new Map<string, number>();
      for (const v of nonNullValues) {
        const key = String(v);
        freq.set(key, (freq.get(key) ?? 0) + 1);
      }
      const freqArr = Array.from(freq.entries()).map(([value, count]) => ({ value, count }));
      freqArr.sort((a, b) => b.count - a.count);
      summary.categorical = freqArr.slice(0, 50);
      summary.cardinality = freq.size;
    }

    if (!detectedTimeField && (inferredType === 'datetime' || /time|date/i.test(field))) {
      detectedTimeField = field;
    }

    fields.push(summary);
  }

  // Correlation (sampled) for numeric fields, excluding likely ID fields
  const numericFields = fields.filter(f => f.numeric && Number.isFinite(f.numeric.min) && Number.isFinite(f.numeric.max));
  const commonIdPatterns = /id$|num$|number$|index$|version$|code$/i;
  const MAX_CARDINALITY_RATIO_FOR_CORRELATION = 0.5;
  const ABSOLUTE_CARDINALITY_THRESHOLD = 1000;

  const fieldsForCorrelation = numericFields.filter(f => {
    // Filter 1: Name check
    if (commonIdPatterns.test(f.field)) {
      return false;
    }
    // Filter 2: Cardinality check for integers
    if (f.type === 'integer') {
      const cardinality = f.cardinality ?? 0;
      const ratio = rowCount > 0 ? cardinality / rowCount : 1;
      return ratio <= MAX_CARDINALITY_RATIO_FOR_CORRELATION && cardinality <= ABSOLUTE_CARDINALITY_THRESHOLD;
    }
    return true; // Keep non-integer numeric fields
  });

  if (fieldsForCorrelation.length >= 2 && rowCount > 0) {
    const cols = fieldsForCorrelation.map(f => rows.map(r => tryParseNumber(r?.[f.field]) ?? NaN).filter(n => Number.isFinite(n)));
    const m = fieldsForCorrelation.length;
    const matrix: number[][] = Array.from({ length: m }, () => Array(m).fill(1));
    for (let i = 0; i < m; i++) {
      for (let j = i + 1; j < m; j++) {
        const a = cols[i];
        const b = cols[j];
        const n = Math.min(a.length, b.length);
        const corr = n >= 2 ? pearsonCorrelation(a.slice(0, n), b.slice(0, n)) : NaN;
        matrix[i][j] = matrix[j][i] = corr;
      }
    }
    return { rowCount, fields, detectedTimeField, correlation: { fields: fieldsForCorrelation.map(f => f.field), matrix, sampled: rowCount } };
  }

  return { rowCount, fields, detectedTimeField };
}

export function basicCsvParse(text: string): any[] {
  // Simple CSV parser (no quoted field support). For robust parsing, consider a CSV library.
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const obj: any = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] !== undefined ? cols[idx] : null;
    });
    rows.push(obj);
  }
  return rows;
}


