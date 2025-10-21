export type InferredType = 'number' | 'integer' | 'boolean' | 'datetime' | 'string' | 'null' | 'heliographic' | 'unknown';

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

export interface ChartConfig {
  type: 'bar' | 'pie' | 'scatter';
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[] | Array<{ x: number; y: number; r?: number }>;
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }>;
  };
  options: {
    scales?: any;
    plugins?: { title: { display: boolean; text: string } };
  };
}

export interface EdaResult {
  rowCount: number;
  fields: FieldSummary[];
  detectedTimeField?: string;
  correlation?: {
    fields: string[];
    matrix: number[][];
    sampled: number;
  };
  charts: ChartConfig[];
}

// Helper Functions (Updated)
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

// New: Parse heliographic coordinates (e.g., "N16E65" → { lat: 16, lon: 65 })
function tryParseHeliographic(value: any): { lat: number; lon: number } | null {
  if (typeof value !== 'string' || !value) return null;
  const match = value.match(/^([NS])(\d+)([EW])(\d+)$/i);
  if (!match) return null;
  const [, latDir, latVal, lonDir, lonVal] = match;
  const lat = parseInt(latVal) * (latDir.toUpperCase() === 'N' ? 1 : -1);
  const lon = parseInt(lonVal) * (lonDir.toUpperCase() === 'E' ? 1 : -1);
  return { lat, lon };
}

function inferFieldType(values: any[]): InferredType {
  let sawNumber = false;
  let sawInteger = true;
  let sawBoolean = false;
  let sawDatetime = false;
  let sawString = false;
  let sawHeliographic = false;
  let sawNonNull = false;

  for (const v of values) {
    if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) continue;
    sawNonNull = true;
    const heli = tryParseHeliographic(v);
    if (heli) {
      sawHeliographic = true;
      continue;
    }
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
  if (sawHeliographic && !sawString && !sawNumber && !sawBoolean && !sawDatetime) return 'heliographic';
  if (sawNumber && !sawString && !sawBoolean && !sawDatetime && !sawHeliographic) return sawInteger ? 'integer' : 'number';
  if (sawBoolean && !sawString && !sawNumber && !sawDatetime && !sawHeliographic) return 'boolean';
  if (sawDatetime && !sawString && !sawNumber && !sawBoolean && !sawHeliographic) return 'datetime';
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

// New: Flatten DONKI CME JSON
function flattenDonkiCme(rows: any[]): any[] {
  const flatRows: any[] = [];
  for (const event of rows) {
    if (!event.cmeAnalyses) continue;
    const analysis = event.cmeAnalyses.find((a: any) => a.isMostAccurate) || event.cmeAnalyses[0];
    if (!analysis) continue;
    const sourceLoc = tryParseHeliographic(event.sourceLocation);
    flatRows.push({
      activityID: event.activityID,
      startTime: event.startTime,
      sourceLocation: event.sourceLocation,
      sourceLat: sourceLoc ? sourceLoc.lat : null,
      sourceLon: sourceLoc ? sourceLoc.lon : null,
      activeRegionNum: event.activeRegionNum,
      speed_kms: analysis.speed,
      halfAngle_deg: analysis.halfAngle,
      latitude_deg: analysis.latitude,
      longitude_deg: analysis.longitude,
      type: analysis.type,
      note: analysis.note || null,
    });
  }
  return flatRows;
}

// New: Generate Charts
function generateCharts(fields: FieldSummary[], rows: any[]): ChartConfig[] {
  const charts: ChartConfig[] = [];
  const numericFields = fields.filter(f => f.type === 'number' || f.type === 'integer');
  const categoricalFields = fields.filter(f => f.type === 'string' || f.type === 'boolean');

  // Histogram for numeric fields (e.g., speed_kms, halfAngle_deg)
  for (const field of numericFields.filter(f => f.numeric)) {
    const values = rows.map(r => tryParseNumber(r[field.field])).filter(n => Number.isFinite(n)) as number[];
    const min = field.numeric!.min;
    const max = field.numeric!.max;
    const binCount = Math.min(10, Math.ceil(Math.sqrt(values.length)));
    const binWidth = (max - min) / binCount;
    const bins = Array(binCount).fill(0);
    const labels = Array(binCount).fill('').map((_, i) => `${Math.round(min + i * binWidth)}-${Math.round(min + (i + 1) * binWidth)}`);
    
    for (const v of values) {
      const binIdx = Math.min(binCount - 1, Math.floor((v - min) / binWidth));
      bins[binIdx]++;
    }

    charts.push({
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: `Count of ${field.field}`,
          data: bins,
          backgroundColor: '#1f77b4',
          borderColor: '#1f77b4',
          borderWidth: 1,
        }],
      },
      options: {
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Count' } },
          x: { title: { display: true, text: field.field } },
        },
        plugins: { title: { display: true, text: `Histogram of ${field.field}` } },
      },
    });
  }

  // Pie chart for categorical fields (e.g., type)
  for (const field of categoricalFields.filter(f => f.categorical && f.cardinality! <= 10)) {
    const catData = field.categorical!;
    charts.push({
      type: 'pie',
      data: {
        labels: catData.map(c => c.value),
        datasets: [{
          label: field.field,
          data: catData.map(c => c.count),
          backgroundColor: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
          borderColor: ['#ffffff'],
          borderWidth: 1,
        }],
      },
      options: {
        plugins: { title: { display: true, text: `Distribution of ${field.field}` } },
      },
    });
  }

  // Scatter plot for lat/lon (colored by speed)
  const latField = fields.find(f => f.field === 'latitude_deg');
  const lonField = fields.find(f => f.field === 'longitude_deg');
  const speedField = fields.find(f => f.field === 'speed_kms');
  if (latField?.numeric && lonField?.numeric && speedField?.numeric) {
    const scatterData = rows.map(r => ({
      x: tryParseNumber(r.longitude_deg) || 0,
      y: tryParseNumber(r.latitude_deg) || 0,
      r: Math.min(15, Math.max(5, ((tryParseNumber(r.speed_kms) || 200) - 200) / 100)),
    }));
    charts.push({
      type: 'scatter',
      data: {
        labels: [],
        datasets: [{
          label: 'CME Events',
          data: scatterData,
          backgroundColor: '#ff7f0e',
          borderColor: '#ff7f0e',
          borderWidth: 1,
        }],
      },
      options: {
        scales: {
          x: { title: { display: true, text: 'Longitude (deg)' }, min: -180, max: 180 },
          y: { title: { display: true, text: 'Latitude (deg)' }, min: -90, max: 90 },
        },
        plugins: { title: { display: true, text: 'CME Locations (Size by Speed)' } },
      },
    });
  }

  return charts;
}

export function analyzeDataset(rows: any[], isDonkiCme: boolean = false): EdaResult {
  let data = rows;
  if (isDonkiCme) {
    data = flattenDonkiCme(rows); // Handle nested cmeAnalyses
  }

  if (!Array.isArray(data)) return { rowCount: 0, fields: [], charts: [] };
  const rowCount = data.length;
  const fieldNames = Array.from(
    data.reduce((set: Set<string>, row: any) => {
      if (row && typeof row === 'object') {
        Object.keys(row).forEach((k) => set.add(k));
      }
      return set;
    }, new Set<string>())
  );

  const fields: FieldSummary[] = [];
  let detectedTimeField: string | undefined = undefined;

  for (const field of fieldNames) {
    const values = data.map((r) => (r ? r[field] : undefined));
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

    if (inferredType === 'string' || inferredType === 'boolean' || inferredType === 'integer' || inferredType === 'heliographic') {
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

  // Correlation for specific CME fields
  const fieldsForCorrelation = fields.filter(f => ['speed_kms', 'halfAngle_deg', 'latitude_deg', 'longitude_deg'].includes(f.field) && f.numeric);
  let correlation: EdaResult['correlation'] = undefined;
  if (fieldsForCorrelation.length >= 2 && rowCount > 0) {
    const cols = fieldsForCorrelation.map(f => data.map(r => tryParseNumber(r[f.field]) ?? NaN).filter(n => Number.isFinite(n)));
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
    correlation = { fields: fieldsForCorrelation.map(f => f.field), matrix, sampled: rowCount };
  }

  // Generate charts
  const charts = generateCharts(fields, data);

  return { rowCount, fields, detectedTimeField, correlation, charts };
}

// Updated CSV Parser (for fallback, but DONKI uses JSON)
export function basicCsvParse(text: string): any[] {
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