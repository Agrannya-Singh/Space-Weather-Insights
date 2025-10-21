/**
 * @fileoverview Robust Exploratory Data Analysis (EDA) engine.
 * This file contains the logic for analyzing datasets, inferring types,
 * cleaning data, deriving new fields, and calculating statistical summaries.
 * It is designed to be independent of the rendering framework.
 */

// --- Type Definitions ---
export type InferredType = 'number' | 'integer' | 'boolean' | 'datetime' | 'string' | 'null' | 'heliographic' | 'ignored';

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
  processedData: any[]; // The cleaned, flattened data for frontend use
  detectedTimeField?: string;
  correlation?: {
    fields: string[];
    matrix: number[][];
  };
}

// --- EDA Blacklist Configuration ---
// Fields to ignore for all quantitative analysis (histograms, correlations, etc.)
const EDA_BLACKLIST_PATTERNS: RegExp[] = [
    /id$/i, /num$/i, /number$/i, /^version/i, /catalog$/i, /index$/i,
    /^activityID$/i, /^flrID$/i, /^cmeID$/i, /^link$/i, /^note$/i, /source$/i
];

// Helper to check if a field should be ignored for detailed analysis
function isBlacklistedForAnalysis(fieldName: string): boolean {
  return EDA_BLACKLIST_PATTERNS.some(pattern => pattern.test(fieldName));
}

// --- Parsing and Type Inference Helpers ---
function tryParseNumber(value: any): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || isNaN(Number(trimmed))) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function tryParseHeliographic(value: any): { lat: number; lon: number } | null {
  if (typeof value !== 'string' || !value) return null;
  const match = value.trim().match(/^([NS])(\d+)([EW])(\d+)$/i);
  if (!match) return null;
  const [, latDir, latVal, lonDir, lonVal] = match;
  const lat = parseInt(latVal, 10) * (latDir.toUpperCase() === 'S' ? -1 : 1);
  const lon = parseInt(lonVal, 10) * (lonDir.toUpperCase() === 'W' ? 1 : -1);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

function inferFieldType(values: any[]): InferredType {
    let nonNullCount = 0;
    let heliographicCount = 0, dateCount = 0, numberCount = 0, boolCount = 0;
    const sample = values.slice(0, 500);

    for (const v of sample) {
        if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) continue;
        nonNullCount++;
        if (tryParseHeliographic(v)) heliographicCount++;
        else if (tryParseNumber(v) !== null) numberCount++;
        else if (new Date(v as any).toString() !== 'Invalid Date' && String(v).length > 8) dateCount++;
        else if (['true', 'false', 'yes', 'no', '0', '1'].includes(String(v).toLowerCase())) boolCount++;
    }

    if (nonNullCount === 0) return 'null';
    const ratio = (count: number) => count / nonNullCount;

    if (ratio(heliographicCount) > 0.9) return 'heliographic';
    if (ratio(numberCount) > 0.9) {
        const allIntegers = sample.every(v => {
            const n = tryParseNumber(v);
            return n === null || Number.isInteger(n);
        });
        return allIntegers ? 'integer' : 'number';
    }
    if (ratio(dateCount) > 0.8) return 'datetime';
    if (ratio(boolCount) > 0.95) return 'boolean';
    return 'string';
}

// --- Statistical Helpers ---
function quantiles(sortedNumbers: number[], q: number): number {
  if (sortedNumbers.length === 0) return NaN;
  const pos = (sortedNumbers.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sortedNumbers[base] + (rest * (sortedNumbers[base + 1] - sortedNumbers[base]) || 0);
}

function stdDev(numbers: number[], mean: number): number {
  if (numbers.length <= 1) return 0;
  const variance = numbers.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) / (numbers.length - 1);
  return Math.sqrt(variance);
}

function pearsonCorrelation(x: (number|null)[], y: (number|null)[]): number {
    let n = 0;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;

    for (let i = 0; i < Math.min(x.length, y.length); i++) {
        const xi = x[i];
        const yi = y[i];
        if (xi !== null && yi !== null && isFinite(xi) && isFinite(yi)) {
            n++;
            sumX += xi; sumY += yi; sumXY += xi * yi; sumXX += xi * xi; sumYY += yi * yi;
        }
    }
    if (n < 2) return NaN;
    const cov = sumXY - (sumX * sumY) / n;
    const varX = sumXX - (sumX * sumX) / n;
    const varY = sumYY - (sumY * sumY) / n;
    const denom = Math.sqrt(varX * varY);
    return denom === 0 ? NaN : cov / denom;
}


// --- Data Pre-processing ---
function preprocessData(rows: any[], eventType: string): any[] {
    if (!Array.isArray(rows)) return [];

    let processed = rows.map(row => ({...row}));

    if (eventType === 'CME') {
        processed = rows.map(event => {
            if (!event.cmeAnalyses?.length) return null;
            const analysis = event.cmeAnalyses.find((a: any) => a.isMostAccurate) || event.cmeAnalyses[0];
            const sourceLoc = tryParseHeliographic(event.sourceLocation);
            return {
                ...event, ...analysis,
                sourceLat: sourceLoc?.lat,
                sourceLon: sourceLoc?.lon,
            };
        }).filter((r): r is object => r !== null);
    } else if (eventType === 'FLR') {
        processed = rows.map(event => {
            const sourceLoc = tryParseHeliographic(event.sourceLocation);
            const intensityMatch = String(event.classType || '').match(/(\d+(\.\d+)?)/);
            const duration = (event.endTime && event.beginTime) ? (new Date(event.endTime).getTime() - new Date(event.beginTime).getTime()) / 60000 : null;
            return {
                ...event,
                sourceLat: sourceLoc?.lat,
                sourceLon: sourceLoc?.lon,
                intensityValue: intensityMatch ? parseFloat(intensityMatch[1]) : null,
                durationMinutes: duration
            };
        });
    } else if (eventType === 'GST') {
        processed = rows.map(event => {
            if (!event.allKpIndex?.length) return {...event, maxKpIndex: null};
            const maxKp = event.allKpIndex.reduce((max: number, kp: any) => Math.max(max, kp.kpIndex || 0), 0);
            return {...event, maxKpIndex: maxKp};
        });
    }

    return processed;
}


// --- Main Analysis Function ---
export function analyzeDataset(rows: any[], eventType: string): EdaResult {
    const processedData = preprocessData(rows, eventType);

    if (processedData.length === 0) {
        return { rowCount: 0, fields: [], processedData: [] };
    }

    const rowCount = processedData.length;
    const fieldNames = Array.from(processedData.reduce((set, row) => (Object.keys(row).forEach(k => set.add(k)), set), new Set<string>()));
    const fields: FieldSummary[] = [];
    let detectedTimeField: string | undefined = undefined;

    for (const field of fieldNames) {
        const values = processedData.map(r => r[field]);
        const nonNullValues = values.filter(v => v !== null && v !== undefined && String(v).trim() !== '');

        const summary: FieldSummary = {
            field, type: 'string',
            missingCount: rowCount - nonNullValues.length,
            missingPercent: (1 - nonNullValues.length / rowCount) * 100,
            sampleValues: nonNullValues.slice(0, 5).map(v => typeof v === 'object' ? JSON.stringify(v) : v),
        };

        if (isBlacklistedForAnalysis(field)) {
            summary.type = 'ignored';
            fields.push(summary);
            continue;
        }

        summary.type = inferFieldType(values);

        if (summary.type === 'number' || summary.type === 'integer') {
            const nums = nonNullValues.map(v => tryParseNumber(v)).filter((n): n is number => n !== null);
            if (nums.length > 0) {
                const sorted = [...nums].sort((a, b) => a - b);
                const count = nums.length;
                const mean = count ? nums.reduce((a, b) => a + b, 0) / count : NaN;
                summary.numeric = {
                    count, mean, stddev: stdDev(nums, mean),
                    min: sorted[0], max: sorted[sorted.length - 1],
                    p25: quantiles(sorted, 0.25), median: quantiles(sorted, 0.5), p75: quantiles(sorted, 0.75),
                };
            }
        }

        if (['string', 'boolean', 'integer'].includes(summary.type)) {
            const freq = new Map<string, number>();
            nonNullValues.forEach(v => {
                const key = String(v);
                freq.set(key, (freq.get(key) ?? 0) + 1);
            });
            summary.cardinality = freq.size;
            summary.categorical = Array.from(freq.entries()).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count).slice(0, 20);
        }

        if (!detectedTimeField && summary.type === 'datetime') {
            detectedTimeField = field;
        }

        fields.push(summary);
    }

    const numericFieldsForCorrelation = fields.filter(f => f.numeric && f.type !== 'ignored' && (f.cardinality || 0) < rowCount * 0.9);
    let correlation: EdaResult['correlation'] = undefined;

    if (numericFieldsForCorrelation.length >= 2) {
        const matrix: number[][] = Array(numericFieldsForCorrelation.length).fill(0).map(() => Array(numericFieldsForCorrelation.length).fill(0));
        for (let i = 0; i < numericFieldsForCorrelation.length; i++) {
            matrix[i][i] = 1;
            for (let j = i + 1; j < numericFieldsForCorrelation.length; j++) {
                const xField = numericFieldsForCorrelation[i].field;
                const yField = numericFieldsForCorrelation[j].field;
                const xValues = processedData.map(r => tryParseNumber(r[xField]));
                const yValues = processedData.map(r => tryParseNumber(r[yField]));
                const corr = pearsonCorrelation(xValues, yValues);
                matrix[i][j] = matrix[j][i] = corr;
            }
        }
        correlation = { fields: numericFieldsForCorrelation.map(f => f.field), matrix };
    }

    return { rowCount, fields, processedData, detectedTimeField, correlation };
}

export function basicCsvParse(text: string): any[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, header, index) => {
      const rawValue = values[index];
      const cleanedValue = rawValue !== undefined ? rawValue.trim().replace(/^"|"$/g, '') : null;
      obj[header] = cleanedValue;
      return obj;
    }, {} as Record<string, any>);
  });
}

// --- Exported for Testing ---
export const _test = {
  tryParseNumber, tryParseHeliographic, inferFieldType,
  quantiles, stdDev, pearsonCorrelation,
  preprocessData,
};          