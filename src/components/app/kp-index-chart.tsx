
"use client"

import * as React from "react"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"
import { format } from "date-fns"
import { DonkiEvent } from "@/lib/types"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

const chartConfig = {
  kpIndex: {
    label: "Kp-Index",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

function getBarColor(value: number) {
    if (value >= 7) return "hsl(var(--destructive))";
    if (value >= 5) return "hsl(var(--chart-4))";
    return "hsl(var(--chart-2))";
}

type KpIndexChartProps = {
  events: DonkiEvent[]
  loading: boolean
}

export function KpIndexChart({ events, loading }: KpIndexChartProps) {
  const chartData = React.useMemo(() => {
    const allKpIndexes = events.flatMap(event => event.allKpIndex || []);
    if (allKpIndexes.length === 0) return [];

    return allKpIndexes
        .map(kp => ({
            time: new Date(kp.observedTime),
            kpIndex: kp.kpIndex,
        }))
        .sort((a, b) => a.time.getTime() - b.time.getTime())
        .map(kp => ({
            ...kp,
            time: format(kp.time, "MMM d, HH:mm"),
            fill: getBarColor(kp.kpIndex)
        }));
  }, [events]);

  if (loading) {
    return <Skeleton className="h-48 w-full" />
  }

  if (chartData.length === 0) {
    return (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>No Kp-Index data available for the selected period.</p>
        </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-48 w-full">
        <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} interval="preserveStartEnd" />
                <YAxis type="number" dataKey="kpIndex" domain={[0, 9]} tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                />
                <Bar dataKey="kpIndex" radius={2}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Bar>
            </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
