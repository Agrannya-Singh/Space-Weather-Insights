"use client";

import React, { useMemo } from "react";
import { analyzeDataset, EdaResult, FieldSummary } from "../../lib/eda"; // FIXED IMPORT PATH
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Scatter, ScatterChart, Tooltip as ReTooltip, XAxis, YAxis, ResponsiveContainer, PolarGrid, PolarAngleAxis, PolarRadiusAxis, RadarChart, Radar } from "recharts";
import { EventType } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AutoEdaProps {
  data: any[];
  eventType: EventType;
}

// --- Reusable Chart Components ---

const HistogramChart = ({ field, rows }: { field: FieldSummary; rows: any[] }) => {
  const histogramData = useMemo(() => {
    if (!field.numeric) return [];
    const { min, max } = field.numeric;
    if (!isFinite(min) || !isFinite(max) || min === max) return [];
    const binCount = 10;
    const width = (max - min) / binCount;
    const bins = Array.from({ length: binCount }, (_, i) => ({
      name: (min + i * width).toFixed(1),
      count: 0,
    }));
    const values = rows.map(r => r[field.field]).map(Number).filter(isFinite);
    for (const v of values) {
      let idx = Math.floor((v - min) / width);
      if (idx >= binCount) idx = binCount - 1;
      if (idx < 0) idx = 0;
      bins[idx].count++;
    }
    return bins;
  }, [field, rows]);

  if (histogramData.length === 0) return <p className="text-sm text-muted-foreground">Not enough data for histogram.</p>;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={histogramData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis />
        <ReTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="hsl(var(--primary))" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const CategoricalBarChart = ({ field }: { field: FieldSummary }) => {
  const data = field.categorical?.slice(0, 10) ?? [];
  if (data.length === 0) return <p className="text-sm text-muted-foreground">Not enough data for chart.</p>;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ left: 30 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="value" type="category" width={80} tick={{ fontSize: 10 }} />
        <ReTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="hsl(var(--chart-2))" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const ScatterPlot = ({ xField, yField, rows }: { xField: string; yField: string; rows: any[] }) => {
    const points = useMemo(() => rows.map(r => ({
        x: Number(r[xField]),
        y: Number(r[yField])
    })).filter(p => isFinite(p.x) && isFinite(p.y)), [xField, yField, rows]);

    if (points.length < 2) return <p className="text-sm text-muted-foreground">Not enough data for scatter plot.</p>;

    return (
        <ResponsiveContainer width="100%" height={250}>
            <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" name={xField} type="number" domain={['dataMin', 'dataMax']} tick={{ fontSize: 10 }} />
                <YAxis dataKey="y" name={yField} type="number" domain={['dataMin', 'dataMax']} tick={{ fontSize: 10 }} />
                <ReTooltip content={<ChartTooltipContent />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={points} fill="hsl(var(--chart-4))" />
            </ScatterChart>
        </ResponsiveContainer>
    );
};

const TimeSeriesChart = ({ timeField, rows }: { timeField: string; rows: any[] }) => {
    const timeSeriesData = useMemo(() => {
        const counts = new Map<string, number>();
        for (const r of rows) {
            const t = r[timeField];
            if (!t) continue;
            const d = new Date(t);
            if (isNaN(d.getTime())) continue;
            const key = d.toISOString().slice(0, 10);
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        const arr = Array.from(counts.entries()).map(([time, count]) => ({ time, count }));
        arr.sort((a, b) => a.time.localeCompare(b.time));
        return arr;
    }, [timeField, rows]);

    if (timeSeriesData.length < 2) return <p className="text-sm text-muted-foreground">Not enough time-series data to plot.</p>;

    return (
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis />
                <ReTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={false} />
            </LineChart>
        </ResponsiveContainer>
    );
};

const PolarPlot = ({ latField, lonField, rows }: { latField: string; lonField: string; rows: any[] }) => {
    const polarData = useMemo(() => rows.map(r => ({
        latitude: Number(r[latField]),
        longitude: Number(r[lonField])
    })).filter(p => isFinite(p.latitude) && isFinite(p.longitude)), [latField, lonField, rows]);

    if (polarData.length === 0) return <p className="text-sm text-muted-foreground">No location data for polar plot.</p>;

    return (
      <ResponsiveContainer width="100%" height={250}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={polarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="longitude" type="number" domain={[-180, 180]} tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[-90, 90]} />
                <ReTooltip content={<ChartTooltipContent />} />
                <Radar name="Location" dataKey="latitude" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.6} />
            </RadarChart>
      </ResponsiveContainer>
    );
}

// --- Main Component ---
export function AutoEda({ data, eventType }: AutoEdaProps) {
    const result: EdaResult | null = useMemo(() => {
        if (!data || data.length === 0) return null;
        return analyzeDataset(data, eventType);
    }, [data, eventType]);

    if (!result) return null;

    const { rowCount, fields, processedData, detectedTimeField, correlation } = result;

    const numericFields = fields.filter(f => f.numeric && f.type !== 'ignored');
    const categoricalFields = fields.filter(f => f.categorical && f.cardinality && f.cardinality > 1 && f.cardinality < 20 && f.type !== 'ignored');
    
    const latField = fields.find(f => f.field.toLowerCase().includes('lat') && f.type !== 'ignored');
    const lonField = fields.find(f => f.field.toLowerCase().includes('lon') && f.type !== 'ignored');

    return (
        <Card className="bg-card/50">
            <CardHeader>
                <CardTitle>Automatic EDA</CardTitle>
                <CardDescription>Generated insights for the filtered dataset of {rowCount} events.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="visualizations">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
                        <TabsTrigger value="summary">Field Summary</TabsTrigger>
                        <TabsTrigger value="correlation">Correlation</TabsTrigger>
                    </TabsList>

                    <TabsContent value="visualizations" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {detectedTimeField && <Card><CardHeader><CardTitle>Events Over Time</CardTitle></CardHeader><CardContent><TimeSeriesChart timeField={detectedTimeField} rows={processedData} /></CardContent></Card>}
                        {numericFields[0] && <Card><CardHeader><CardTitle>Histogram: {numericFields[0].field}</CardTitle></CardHeader><CardContent><HistogramChart field={numericFields[0]} rows={processedData} /></CardContent></Card>}
                        {categoricalFields[0] && <Card><CardHeader><CardTitle>Distribution: {categoricalFields[0].field}</CardTitle></CardHeader><CardContent><CategoricalBarChart field={categoricalFields[0]} /></CardContent></Card>}
                        {numericFields.length >= 2 && <Card><CardHeader><CardTitle>Scatter: {numericFields[0].field} vs {numericFields[1].field}</CardTitle></CardHeader><CardContent><ScatterPlot xField={numericFields[0].field} yField={numericFields[1].field} rows={processedData} /></CardContent></Card>}
                        {latField && lonField && <Card><CardHeader><CardTitle>Heliographic Location</CardTitle></CardHeader><CardContent><PolarPlot latField={latField.field} lonField={lonField.field} rows={processedData} /></CardContent></Card>}
                        {numericFields[1] && <Card><CardHeader><CardTitle>Histogram: {numericFields[1].field}</CardTitle></CardHeader><CardContent><HistogramChart field={numericFields[1]} rows={processedData} /></CardContent></Card>}
                    </TabsContent>

                    <TabsContent value="summary" className="mt-4">
                       <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-muted">
                                <tr>
                                    <th className="p-2 text-left">Field</th>
                                    <th className="p-2 text-left">Type</th>
                                    <th className="p-2 text-left">Missing</th>
                                    <th className="p-2 text-left">Mean / Top Category</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fields.map(f => (
                                    <tr key={f.field} className="border-t">
                                        <td className="p-2 font-medium">{f.field}</td>
                                        <td className="p-2">{f.type}</td>
                                        <td className="p-2">{f.missingPercent.toFixed(1)}%</td>
                                        <td className="p-2 truncate max-w-[200px]">
                                            {f.numeric ? f.numeric.mean.toFixed(2) : (f.categorical ? f.categorical[0]?.value : 'N/A')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                       </div>
                    </TabsContent>

                    <TabsContent value="correlation" className="mt-4">
                        {correlation && correlation.fields.length >= 2 ? (
                            <div className="overflow-auto">
                                <table className="text-xs">
                                    <thead>
                                        <tr>
                                            <th className="p-1" />
                                            {correlation.fields.map(f => <th key={f} className="p-1 text-left whitespace-nowrap">{f}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {correlation.matrix.map((row, i) => (
                                            <tr key={i}>
                                                <td className="p-1 pr-2 font-medium whitespace-nowrap">{correlation.fields[i]}</td>
                                                {row.map((val, j) => (
                                                    <td key={j} className="p-1 text-center text-background font-semibold" style={{ backgroundColor: isNaN(val) ? 'hsl(var(--muted))' : val >= 0 ? `rgba(16, 185, 129, ${Math.abs(val)})` : `rgba(244, 63, 94, ${Math.abs(val)})` }}>
                                                        {isNaN(val) ? 'N/A' : val.toFixed(2)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className="text-sm text-muted-foreground">Not enough relevant numeric fields to compute correlation.</p>}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

// --- IGNORE ---     