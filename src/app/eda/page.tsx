"use client";

import { useMemo, useState } from "react";
import { analyzeDataset, basicCsvParse, EdaResult } from "@/lib/eda";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

type UploadedFormat = "json" | "csv";

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export default function EdaPage() {
  const [rawText, setRawText] = useState("");
  const [format, setFormat] = useState<UploadedFormat>("json");
  const [rows, setRows] = useState<any[]>([]);
  const [result, setResult] = useState<EdaResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = () => {
    try {
      let parsed: any[] = [];
      if (format === "json") {
        const maybe = JSON.parse(rawText);
        parsed = Array.isArray(maybe) ? maybe : (maybe?.data && Array.isArray(maybe.data) ? maybe.data : []);
      } else {
        parsed = basicCsvParse(rawText);
      }
      setRows(parsed);
      setResult(analyzeDataset(parsed));
    } catch (e) {
      console.error(e);
      setRows([]);
      setResult({ rowCount: 0, fields: [] });
    }
  };

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setLoading(true);
    try {
      const text = await readFileAsText(file);
      setRawText(text);
    } finally {
      setLoading(false);
    }
  };

  const histogramData = useMemo(() => {
    if (!result) return {} as Record<string, { bins: { name: string; count: number }[] }>;
    const data: Record<string, { bins: { name: string; count: number }[] }> = {};
    for (const f of result.fields) {
      if (!f.numeric || !f.numeric.count) continue;
      const min = f.numeric.min;
      const max = f.numeric.max;
      if (!isFinite(min) || !isFinite(max) || min === max) continue;
      const binCount = 10;
      const width = (max - min) / binCount;
      const bins = new Array(binCount).fill(0).map((_, i) => ({ name: `${(min + i * width).toFixed(2)}`, count: 0 }));
      const values = rows.map((r) => r[f.field]).map((v) => Number(v)).filter((n) => Number.isFinite(n));
      for (const v of values) {
        let idx = Math.floor((v - min) / width);
        if (idx >= binCount) idx = binCount - 1;
        if (idx < 0) idx = 0;
        bins[idx].count += 1;
      }
      data[f.field] = { bins };
    }
    return data;
  }, [result, rows]);

  const topCategoricals = useMemo(() => {
    if (!result) return [] as { field: string; values: { value: string; count: number }[] }[];
    return result.fields
      .filter((f) => f.categorical && (f.type === 'string' || f.type === 'boolean' || f.type === 'integer'))
      .slice(0, 6)
      .map((f) => ({ field: f.field, values: (f.categorical ?? []).slice(0, 12) }));
  }, [result]);

  const timeSeriesCandidates = useMemo(() => {
    if (!result?.detectedTimeField) return [] as { time: string; count: number }[];
    const tField = result.detectedTimeField;
    const counts = new Map<string, number>();
    for (const r of rows) {
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
  }, [result, rows]);

  const handleDownloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eda_result.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <h2 className="text-2xl font-bold">Exploratory Data Analysis</h2>

      <Card>
        <CardHeader>
          <CardTitle>Load Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-sm">Format:</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as UploadedFormat)}
              className="border rounded px-2 py-1"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
            <Input type="file" accept={format === 'json' ? '.json,.txt' : '.csv,.txt'} onChange={(e) => handleFile(e.target.files?.[0])} />
            <Button onClick={handleAnalyze} disabled={!rawText || loading}>
              Analyze
            </Button>
          </div>
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={format === 'json' ? 'Paste JSON array here' : 'Paste CSV text here'}
            className="min-h-[160px]"
          />
        </CardContent>
      </Card>

      {result && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="numeric">Numeric</TabsTrigger>
            <TabsTrigger value="categorical">Categorical</TabsTrigger>
            <TabsTrigger value="time">Time Series</TabsTrigger>
            <TabsTrigger value="correlation">Correlation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Dataset Summary</CardTitle>
                  <Button variant="outline" onClick={handleDownloadJson}>Download EDA JSON</Button>
                </div>
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

            <Card>
              <CardHeader>
                <CardTitle>Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[320px]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="p-2">Field</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Missing</th>
                        <th className="p-2">Cardinality</th>
                        <th className="p-2">Sample</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.fields.map((f) => (
                        <tr key={f.field} className="border-t">
                          <td className="p-2 font-medium">{f.field}</td>
                          <td className="p-2">{f.type}</td>
                          <td className="p-2">{f.missingCount} ({f.missingPercent.toFixed(1)}%)</td>
                          <td className="p-2">{f.cardinality ?? '—'}</td>
                          <td className="p-2 whitespace-nowrap truncate max-w-[360px]">{f.sampleValues.map((v) => JSON.stringify(v)).join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="numeric" className="space-y-4">
            {result.fields.filter((f) => f.numeric).map((f) => (
              <Card key={f.field}>
                <CardHeader>
                  <CardTitle>{f.field}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <Stat label="Min" value={f.numeric?.min} />
                    <Stat label="Max" value={f.numeric?.max} />
                    <Stat label="Mean" value={f.numeric?.mean} />
                    <Stat label="Median" value={f.numeric?.median} />
                    <Stat label="P25" value={f.numeric?.p25} />
                    <Stat label="P75" value={f.numeric?.p75} />
                    <Stat label="StdDev" value={f.numeric?.stddev} />
                  </div>
                  {histogramData[f.field] && (
                    <ChartContainer config={{}} className="h-[240px] w-full">
                      <BarChart data={histogramData[f.field].bins}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="#0ea5e9" />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="categorical" className="space-y-4">
            {topCategoricals.map((cat) => (
              <Card key={cat.field}>
                <CardHeader>
                  <CardTitle>{cat.field}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[240px] w-full">
                    <BarChart data={cat.values}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="value" tick={{ fontSize: 12 }} hide={false} interval={0} angle={-15} height={50} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="#34d399" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="time" className="space-y-4">
            {timeSeriesCandidates.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>{result?.detectedTimeField} Count Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[240px] w-full">
                    <LineChart data={timeSeriesCandidates}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            ) : (
              <div className="text-sm text-muted-foreground">No time field detected.</div>
            )}
          </TabsContent>

          <TabsContent value="correlation" className="space-y-4">
            {result.correlation && result.correlation.fields.length >= 2 ? (
              <Card>
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
            ) : (
              <div className="text-sm text-muted-foreground">Not enough numeric fields for correlation.</div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value !== undefined && isFinite(value) ? Number(value).toFixed(2) : '—'}</div>
    </div>
  );
}
