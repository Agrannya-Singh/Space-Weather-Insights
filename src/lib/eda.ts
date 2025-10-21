import { PearsonCorrelation } from './stats'; // Assuming you might move stats functions

// --- New Type Definitions ---
export type InferredType = 'number' | 'integer' | 'boolean' | 'datetime' | 'string' | 'null' | 'heliographic' | 'unknown' | 'ignored'; // Added 'ignored' type

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

// Basic Chart Config - Adjust as needed for your charting library (e.g., Recharts)
export interface EdaChartDataPoint {
    name: string; // For labels (bins, categories)
    value: number; // For counts or numeric values
    [key: string]: any; // Allow extra properties for scatter etc.
}

export interface EdaChartConfig {
    title: string;
    type: 'bar' | 'line' | 'scatter'; // Simplified types relevant to Recharts
    xField?: string; // Field for X-axis
    yField?: string; // Field for Y-axis (often 'value')
    data: EdaChartDataPoint[];
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
    // Note: Removed 'charts' array as AutoEDA/EDA Page generate charts dynamically from FieldSummary
}

// --- Blacklist Configuration ---
const EDA_BLACKLIST_PATTERNS: RegExp[] = [
    /id$/i, // Matches fields ending in 'ID' or 'Id'
    /num$/i, // Matches fields ending in 'Num' or 'num' (like activeRegionNum)
    /number$/i, // Matches fields ending in 'Number' or 'number'
    /^version/i, // Matches fields starting with 'version'
    /catalog$/i, // Matches fields ending in 'Catalog' or 'catalog'
    // Add specific field names if needed:
    /^activityID$/i,
    /^flrID$/i,
    /^cmeID$/i, // Might appear in flattened data depending on naming
    /^link$/i, // Usually a URL, not for analysis
    /^note$/i, // Usually text, not for quantitative analysis
    // Add more patterns or specific names as needed
];

// Helper function to check against the blacklist
function isBlacklistedForEDA(fieldName: string): boolean {
  // Exception: Allow 'activeRegionNum' specifically if needed elsewhere,
  // but generally blacklist fields ending in 'Num'. Adjust this logic if required.
  // if (fieldName.toLowerCase() === 'activeregionnum') return false;

  return EDA_BLACKLIST_PATTERNS.some(pattern => pattern.test(fieldName));
}


// --- Helper Functions (Updated) ---
function tryParseNumber(value: any): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '' || trimmed.toLowerCase() === 'na' || trimmed.toLowerCase() === 'none') return null; // Handle common non-numeric strings
        // Handle potential class notations like 'C1.5' - extract number if possible
        const match = trimmed.match(/[+-]?([0-9]*[.])?[0-9]+/);
        if (match && match[0] === trimmed) { // Ensure the whole string is the number
             const parsed = Number(trimmed);
             return Number.isFinite(parsed) ? parsed : null;
        }
        // If it's not purely numeric, return null for quantitative analysis
        return null;
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
    // Stricter date parsing if needed, e.g., require ISO format
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    if (typeof value === 'string' || typeof value === 'number') {
        // Attempt parsing common date/time formats
        const d = new Date(value);
         // Basic validation: Check if it looks like a reasonable date string
         // This is heuristic - a dedicated date parsing library is better for complex cases.
         if (typeof value === 'string' && !/^\d{4}-\d{2}-\d{2}/.test(value) && !isNaN(d.getTime())) {
             // If it parsed but doesn't start like YYYY-MM-DD, be suspicious unless it's a timestamp number
             if (typeof value !== 'number' && value.length < 8) return null; // Avoid parsing short strings as dates
         }
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
}

// Parse heliographic coordinates (e.g., "N16E65" → { lat: 16, lon: -65 }) - Corrected EW logic
function tryParseHeliographic(value: any): { lat: number; lon: number } | null {
    if (typeof value !== 'string' || !value) return null;
    const match = value.trim().match(/^([NS])(\d+)([EW])(\d+)$/i);
    if (!match) return null;
    const [, latDir, latVal, lonDir, lonVal] = match;
    const lat = parseInt(latVal, 10) * (latDir.toUpperCase() === 'N' ? 1 : -1);
    // Standard heliographic longitude: East is negative, West is positive (relative to central meridian)
    // Common DONKI representation might be different, adjust if needed based on source convention.
    // Assuming E=Negative, W=Positive here. Verify with DONKI standard.
    const lon = parseInt(lonVal, 10) * (lonDir.toUpperCase() === 'W' ? 1 : -1);

     // Basic range check
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        return null;
    }

    return { lat, lon };
}


function inferFieldType(values: any[], fieldName: string): InferredType { // Added fieldName for context
    let sawNumber = false;
    let sawInteger = true;
    let sawBoolean = false;
    let sawDatetime = false;
    let sawString = false;
    let sawHeliographic = false;
    let sawNonNull = false;
    let nonNullCount = 0;

    const sampleSize = Math.min(values.length, 500); // Sample for performance

    for (let i = 0; i < sampleSize; i++) {
        const v = values[i];
        if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) continue;

        sawNonNull = true;
        nonNullCount++;

        // Check types in a specific order (more specific first)
        if (tryParseHeliographic(v)) { sawHeliographic = true; continue; }
        const num = tryParseNumber(v);
        if (num !== null) {
            sawNumber = true;
            if (!isIntegerLike(num)) sawInteger = false;
            continue; // Prioritize number over date if ambiguous (e.g., "2024")
        }
        if (tryParseBoolean(v) !== null) { sawBoolean = true; continue; }
         // Be cautious inferring dates from short strings/numbers
        if (typeof v === 'string' && v.length >= 8 || typeof v === 'number') {
            if (tryParseDate(v)) { sawDatetime = true; continue; }
        }

        // If none of the above, it's a string
        sawString = true;
    }

    if (!sawNonNull) return 'null';

    // Disambiguation rules
    // If >95% parse as heliographic and no conflicting strong types (number, boolean), classify as heliographic
    if (sawHeliographic && !sawNumber && !sawBoolean && values.filter(v => tryParseHeliographic(v)).length / nonNullCount > 0.95) return 'heliographic';
    // If >95% parse as numeric and no conflicting strong types (heliographic, boolean, datetime), classify as numeric
    if (sawNumber && !sawHeliographic && !sawBoolean && !sawDatetime && values.filter(v => tryParseNumber(v) !== null).length / nonNullCount > 0.95) return sawInteger ? 'integer' : 'number';
     // If >95% parse as boolean...
    if (sawBoolean && !sawNumber && !sawHeliographic && !sawDatetime && values.filter(v => tryParseBoolean(v) !== null).length / nonNullCount > 0.95) return 'boolean';
     // If >95% parse as datetime... (be stricter maybe?)
    if (sawDatetime && !sawNumber && !sawHeliographic && !sawBoolean && values.filter(v => tryParseDate(v)).length / nonNullCount > 0.90) return 'datetime'; // Slightly lower threshold for dates maybe


    // Fallback: If multiple types seen or mostly strings, classify as string
    return 'string';
}

function quantiles(sortedNumbers: number[], q: number): number {
    if (sortedNumbers.length === 0) return NaN;
    const pos = (sortedNumbers.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (base < 0) return sortedNumbers[0] ?? NaN; // Handle case where q=0 and length=1
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

// --- Specific DONKI Flattening ---
// Flatten DONKI CME JSON - Extracts relevant fields from nested structure
function flattenDonkiCme(rows: any[]): any[] {
    const flatRows: any[] = [];
    for (const event of rows) {
        if (!Array.isArray(event.cmeAnalyses) || event.cmeAnalyses.length === 0) continue;

        // Find the most accurate analysis, or default to the first
        const analysis = event.cmeAnalyses.find((a: any) => a.isMostAccurate === true) || event.cmeAnalyses[0];
        if (!analysis) continue;

        const sourceLoc = tryParseHeliographic(event.sourceLocation);

        flatRows.push({
            // --- Event Level ---
            activityID: event.activityID, // Keep key IDs if needed for joining/reference
            startTime: event.startTime,
            sourceLocation: event.sourceLocation, // Keep original string
            sourceLat: sourceLoc ? sourceLoc.lat : null, // Parsed Latitude
            sourceLon: sourceLoc ? sourceLoc.lon : null, // Parsed Longitude
            activeRegionNum: event.activeRegionNum, // Often null, but keep if present

            // --- Analysis Level ---
            time21_5: analysis.time21_5, // Analysis time
            latitude: analysis.latitude, // Heliographic latitude
            longitude: analysis.longitude, // Heliographic longitude
            halfAngle: analysis.halfAngle, // Angular width / 2
            speed: analysis.speed, // Speed in km/s
            type: analysis.type, // Type (e.g., 'S', 'C')
            isMostAccurate: analysis.isMostAccurate,
            note: analysis.note || '', // Keep notes if they exist
            // Consider adding analysis.catalog if needed
        });
    }
    return flatRows;
}


// --- Main Analysis Function ---
export function analyzeDataset(rows: any[], isDonkiCme: boolean = false): EdaResult {
    let data = rows;
    if (isDonkiCme) {
        data = flattenDonkiCme(rows); // Pre-process if it's DONKI CME data
    }

    if (!Array.isArray(data) || data.length === 0) {
        // Return structure even for empty data
        return { rowCount: 0, fields: [], detectedTimeField: undefined, correlation: undefined };
    }

    const rowCount = data.length;
    // Determine field names from the (potentially flattened) data
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

    // --- Field Analysis Loop ---
    for (const field of fieldNames) {
        const isBlacklisted = isBlacklistedForEDA(field); // Check blacklist

        const values = data.map((r) => (r && typeof r === 'object' ? r[field] : undefined));
        const nonNullValues = values.filter((v) => v !== null && v !== undefined && !(typeof v === 'string' && v.trim() === ''));
        const missingCount = rowCount - nonNullValues.length;
        const missingPercent = rowCount === 0 ? 0 : (missingCount / rowCount) * 100;

        const inferredType = isBlacklisted ? 'ignored' : inferFieldType(values, field); // Infer type only if not blacklisted

        const summary: FieldSummary = {
            field,
            type: inferredType,
            missingCount,
            missingPercent,
            sampleValues: nonNullValues.slice(0, 5).map(v => typeof v === 'object' ? JSON.stringify(v) : v), // Ensure samples are displayable
        };

        // Perform detailed analysis ONLY if not blacklisted
        if (!isBlacklisted) {
            if (inferredType === 'number' || inferredType === 'integer') {
                const nums = nonNullValues.map((v) => tryParseNumber(v)).filter((n): n is number => n !== null && Number.isFinite(n));
                if (nums.length > 0) {
                    const sorted = [...nums].sort((a, b) => a - b);
                    const count = nums.length;
                    const min = sorted[0];
                    const max = sorted[sorted.length - 1];
                    const mean = count ? nums.reduce((a, b) => a + b, 0) / count : NaN;
                    const median = quantiles(sorted, 0.5);
                    const p25 = quantiles(sorted, 0.25);
                    const p75 = quantiles(sorted, 0.75);
                    const sd = stdDev(nums, mean);
                    summary.numeric = { count, min, max, mean, median, p25, p75, stddev: sd };
                }
            }

            if (['string', 'boolean', 'integer', 'heliographic'].includes(inferredType)) {
                 const freq = new Map<string, number>();
                 let uniqueCount = 0;
                 for (const v of nonNullValues) {
                     // Stringify objects/arrays if they appear in supposedly categorical columns
                     const key = typeof v === 'object' ? JSON.stringify(v) : String(v);
                     const currentCount = freq.get(key) ?? 0;
                     if (currentCount === 0) {
                        uniqueCount++;
                     }
                     freq.set(key, currentCount + 1);
                 }
                 const freqArr = Array.from(freq.entries()).map(([value, count]) => ({ value, count }));
                 freqArr.sort((a, b) => b.count - a.count);
                 summary.categorical = freqArr.slice(0, 50); // Limit stored categories
                 summary.cardinality = uniqueCount; // Store exact cardinality
             }

             // Time field detection (only for non-blacklisted fields)
             if (!detectedTimeField && (inferredType === 'datetime' || (inferredType === 'string' && /time|date/i.test(field)))) {
                // Add stronger check: ensure most values parse as dates if type is string
                if (inferredType === 'string') {
                    const dateParseRate = nonNullValues.filter(v => tryParseDate(v)).length / nonNullValues.length;
                    if (dateParseRate > 0.8) { // Require 80% parse rate for string fields
                         detectedTimeField = field;
                    }
                } else { // It's already inferred as datetime
                     detectedTimeField = field;
                }
             }
        } else {
            // For blacklisted fields, still calculate cardinality if simple type
             if (['string', 'boolean', 'integer', 'number', 'heliographic'].includes(inferFieldType(values, field))) { // Use original inference here
                summary.cardinality = new Set(nonNullValues.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v))).size;
             }
        }


        fields.push(summary);
    } // End field analysis loop

    // --- Correlation Analysis ---
    const numericFieldsForAnalysis = fields.filter(f => f.numeric && !isBlacklistedForEDA(f.field)); // Use blacklist here

    // Add cardinality check back if needed (applied only to integers)
    const MAX_CARDINALITY_RATIO_FOR_CORRELATION = 0.7; // Example: Allow up to 70% unique ints
    const ABSOLUTE_CARDINALITY_THRESHOLD = 2000;      // Example: Allow up to 2000 unique ints

     const fieldsForCorrelation = numericFieldsForAnalysis.filter(f => {
         if (f.type === 'integer') {
             const cardinality = f.cardinality ?? 0;
             const ratio = rowCount > 0 ? cardinality / rowCount : 1;
             return ratio <= MAX_CARDINALITY_RATIO_FOR_CORRELATION && cardinality <= ABSOLUTE_CARDINALITY_THRESHOLD;
         }
         return true; // Keep non-integer numeric fields ('number')
     });


    let correlation: EdaResult['correlation'] = undefined;
    if (fieldsForCorrelation.length >= 2 && rowCount > 0) {
        // Use 'data' which might be flattened
        const cols = fieldsForCorrelation.map(f =>
            data.map(r => tryParseNumber(r?.[f.field])).filter((n): n is number => n !== null && Number.isFinite(n))
        );
        const m = fieldsForCorrelation.length;
        const matrix: number[][] = Array.from({ length: m }, () => Array(m).fill(NaN)); // Initialize with NaN

        for (let i = 0; i < m; i++) {
            matrix[i][i] = 1; // Self-correlation is 1
            for (let j = i + 1; j < m; j++) {
                const a = cols[i];
                const b = cols[j];
                // Ensure arrays have same length for Pearson calculation
                const len = Math.min(a.length, b.length);
                const corr = len >= 2 ? pearsonCorrelation(a.slice(0, len), b.slice(0, len)) : NaN;
                matrix[i][j] = matrix[j][i] = corr;
            }
        }
        correlation = { fields: fieldsForCorrelation.map(f => f.field), matrix, sampled: rowCount };
    }


    // Note: Removed automatic chart generation from here.
    // Let frontend components (AutoEDA, EDA Page) generate charts based on FieldSummary.
    // This keeps the core EDA logic focused on analysis, not presentation details.

    return { rowCount, fields, detectedTimeField, correlation };
}

// --- CSV Parser (Fallback) ---
export function basicCsvParse(text: string): any[] {
    // Simple CSV parser (no quoted field support). For robust parsing, consider a CSV library.
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
    if (lines.length === 0) return [];
    // Basic header cleaning: remove quotes, trim spaces
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
        // Basic value splitting (doesn't handle commas within quotes)
        const cols = lines[i].split(',');
        const obj: any = {};
        headers.forEach((h, idx) => {
            const rawValue = cols[idx];
            // Basic value cleaning: remove quotes, trim spaces, handle undefined
             const cleanedValue = rawValue !== undefined
                ? rawValue.trim().replace(/^"|"$/g, '')
                : null;
            obj[h] = cleanedValue;
        });
        rows.push(obj);
    }
    return rows;
}