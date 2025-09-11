"use client";

import { useMemo } from "react";
import { analyzeDataset, EdaResult } from "@/lib/eda";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Scatter, ScatterChart, Tooltip as ReTooltip, XAxis, YAxis } from "recharts";

type EventType = 'GST' | 'IPS' | 'FLR' | 'SEP' | 'MPC' | 'RBE' | 'HSS' | 'WSA' | 'CME';

interface Props {
  data: any[];
  eventType?: EventType;
}

export function AutoEda({ data, eventType }: Props) {
  const result: EdaResult | null = useMemo(() => {
    if (!data || data.length === 0) return null;
    return analyzeDataset(data);
  }, [data]);

  // Event-type presets: prefer certain numeric fields if present
  const preferredNumericOrder = useMemo(() => {
    switch (eventType) {
      case 'CME':
        return ['speed', 'latitude', 'longitude', 'halfAngle', 'width'];
      case 'FLR':
        return ['xrayClass', 'class', 'intensity', 'peak', 'duration'];
      case 'GST':
        return ['kpIndex', 'kp', 'apIndex', 'dst', 'strength'];
      default:
        return ['speed', 'magnitude', 'intensity', 'index', 'value'];
    }
  }, [eventType]);

  const firstNumeric = useMemo(() => {
    if (!result) return undefined;
    // try presets by substring match, else fall back to first numeric
    for (const key of preferredNumericOrder) {
      const f = result.fields.find((x) => x.numeric && x.field.toLowerCase().includes(key.toLowerCase()));
      if (f) return f;
    }
    return result.fields.find((f) => f.numeric);
  }, [result, preferredNumericOrder]);

  const histogram = useMemo(() => {
    if (!result || !firstNumeric?.numeric) return [] as { name: string; count: number }[];
    const field = firstNumeric.field;
    const min = firstNumeric.numeric.min;
    const max = firstNumeric.numeric.max;
    if (!isFinite(min) || !isFinite(max) || min === max) return [];
    const binCount = 10;
    const width = (max - min) / binCount;
    const bins = new Array(binCount).fill(0).map((_, i) => ({ name: `${(min + i * width).toFixed(2)}`, count: 0 }));
    const values = data.map((r) => r?.[field]).map((v) => Number(v)).filter((n) => Number.isFinite(n));
    for (const v of values) {
      let idx = Math.floor((v - min) / width);
      if (idx >= binCount) idx = binCount - 1;
      if (idx < 0) idx = 0;
      bins[idx].count += 1;
    }
    return bins;
  }, [data, result, firstNumeric]);

  // Outlier detection via z-score > 3 for the chosen numeric field
  const outlierSummary = useMemo(() => {
    if (!firstNumeric?.numeric) return undefined as undefined | { field: string; total: number; outliers: number };
    const field = firstNumeric.field;
    const values = data.map((r) => Number(r?.[field])).filter((n) => Number.isFinite(n));
    const mean = firstNumeric.numeric.mean;
    const sd = firstNumeric.numeric.stddev || 0;
    if (!isFinite(mean) || sd === 0) return { field, total: values.length, outliers: 0 };
    const outliers = values.filter((v) => Math.abs((v - mean) / sd) > 3).length;
    return { field, total: values.length, outliers };
  }, [data, firstNumeric]);

  // Top categorical chart removed per request

  const timeSeries = useMemo(() => {
    if (!result?.detectedTimeField) return [] as { time: string; count: number }[];
    const tField = result.detectedTimeField;
    const counts = new Map<string, number>();
    for (const r of data) {
      const t = r?.[tField];
      if (!t) continue;
      const d = new Date(t);
      if (isNaN(d.getTime())) continue;
      const key = d.toISOString().slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const arr = Array.from(counts.entries()).map(([time, count]) => ({ time, count }));
    arr.sort((a, b) => a.time.localeCompare(b.time));
    return arr;
  }, [result, data]);

  const scatter = useMemo(() => {
    if (!result) return undefined as undefined | { xField: string; yField: string; points: { x: number; y: number }[] };
    const numericFields = result.fields.filter((f) => f.numeric).slice(0, 2);
    if (numericFields.length < 2) return undefined;
    const [xF, yF] = numericFields;
    const points = data
      .map((r) => ({ x: Number(r?.[xF.field]), y: Number(r?.[yF.field]) }))
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (!points.length) return undefined;
    return { xField: xF.field, yField: yF.field, points };
  }, [result, data]);

  if (!result) return null;

  return (
    <div className="space-y-6">
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle>Automatic EDA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Rows</div>
              <div className="text-xl font-semibold">{result.rowCount}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Fields</div>
              <div className="text-xl font-semibold">{result.fields.length}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Time Field</div>
              <div className="text-xl font-semibold">{result.detectedTimeField ?? '—'}</div>
            </div>
            {outlierSummary && (
              <div>
                <div className="text-sm text-muted-foreground">Outliers ({outlierSummary.field})</div>
                <div className="text-xl font-semibold">{outlierSummary.outliers} / {outlierSummary.total}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {firstNumeric && histogram.length > 0 && (
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle>Histogram: {firstNumeric.field}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[220px] w-full">
              <BarChart data={histogram}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <ReTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="#0ea5e9" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Top categories chart removed */}

      {timeSeries.length > 0 && (
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle>Events Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[220px] w-full">
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <ReTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {scatter && (
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle>Scatter: {scatter.xField} vs {scatter.yField}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[240px] w-full">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" name={scatter.xField} />
                <YAxis dataKey="y" name={scatter.yField} />
                <ReTooltip content={<ChartTooltipContent />} />
                <Scatter data={scatter.points} fill="#6366f1" />
              </ScatterChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {result.correlation && result.correlation.fields.length >= 2 && (
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle>Correlation Heatmap (sampled {result.correlation.sampled} rows)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="text-xs">
                <thead>
                  <tr>
                    <th className="p-1" />
                    {result.correlation.fields.map((f) => (
                      <th key={f} className="p-1 text-left whitespace-nowrap">{f}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.correlation.matrix.map((row, i) => (
                    <tr key={i}>
                      <td className="p-1 pr-2 font-medium whitespace-nowrap">{result.correlation!.fields[i]}</td>
                      {row.map((val, j) => {
                        const v = isFinite(val) ? val : 0;
                        const intensity = Math.round(Math.abs(v) * 255);
                        const color = v >= 0 ? `rgba(16, 185, 129, ${Math.abs(v)})` : `rgba(244, 63, 94, ${Math.abs(v)})`;
                        return (
                          <td key={j} className="p-1 text-center" style={{ backgroundColor: color }}>
                            {isFinite(val) ? v.toFixed(2) : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


