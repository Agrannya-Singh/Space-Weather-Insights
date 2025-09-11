"use client";

import { useMemo } from "react";
import { analyzeDataset, EdaResult } from "@/lib/eda";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Scatter, ScatterChart, Tooltip as ReTooltip, XAxis, YAxis, ZAxis } from "recharts";

interface Props {
  data: any[];
}

export function AutoEda({ data }: Props) {
  const result: EdaResult | null = useMemo(() => {
    if (!data || data.length === 0) return null;
    return analyzeDataset(data);
  }, [data]);

  const firstNumeric = useMemo(() => {
    if (!result) return undefined;
    return result.fields.find((f) => f.numeric);
  }, [result]);

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
    </div>
  );
}


