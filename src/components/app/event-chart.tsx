
"use client"

import * as React from "react"
import { format } from "date-fns"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

type EventChartProps = {
  events: DonkiEvent[]
  loading: boolean
}

export function EventChart({ events, loading }: EventChartProps) {
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
        }));
  }, [events]);

  if (loading) {
    return <Skeleton className="h-48 w-full" />
  }

  if (chartData.length === 0) {
    return (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>No Kp-Index data available to display chart.</p>
        </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-48 w-full">
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 6)}
        />
         <YAxis
          dataKey="kpIndex"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          domain={[0, 9]}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <defs>
          <linearGradient id="fillKpIndex" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-kpIndex)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-kpIndex)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <Area
          dataKey="kpIndex"
          type="natural"
          fill="url(#fillKpIndex)"
          fillOpacity={0.4}
          stroke="var(--color-kpIndex)"
        />
      </AreaChart>
    </ChartContainer>
  )
}
