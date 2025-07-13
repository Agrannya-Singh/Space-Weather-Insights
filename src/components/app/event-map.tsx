"use client"

import { useMemo } from "react";
import { DonkiEvent } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";

function parseLocation(location: string): [number, number] | null {
  if (!location) return null;
  // For locations like 'S14W01'
  const flrMatch = location.match(/([NS])(\d+)([WE])(\d+)/);
  if (flrMatch) {
    const [, latDir, latStr, lonDir, lonStr] = flrMatch;
    let latitude = parseInt(latStr, 10);
    let longitude = parseInt(lonStr, 10);
    if (latDir === 'S') latitude = -latitude;
    if (lonDir === 'W') longitude = -longitude;
    return [longitude, latitude];
  }

  // For locations like 'S14W01'
  const cmeMatch = location.match(/([NS])(\d+)([WE])(\d+)/);
  if (cmeMatch) {
    const [, latDir, latStr, lonDir, lonStr] = cmeMatch;
    let latitude = parseInt(latStr, 10);
    let longitude = parseInt(lonStr, 10);
    if (latDir === 'S') latitude = -latitude;
    if (lonDir === 'W') longitude = -longitude;
    return [longitude, latitude];
  }

  return null;
}

type EventMapProps = {
  events: DonkiEvent[];
  loading: boolean;
};

export function EventMap({ events, loading }: EventMapProps) {
  const points = useMemo(() => {
    return events
      .map(event => parseLocation(event.sourceLocation || (event.cmeAnalyses?.[0]?.sourceLocation)))
      .filter((p): p is [number, number] => p !== null);
  }, [events]);

  if (loading) {
    return <Skeleton className="h-48 w-full" />;
  }
  
  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <p>No location data available to display map.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 overflow-hidden rounded-lg bg-background">
      <svg viewBox="0 0 800 400" className="w-full h-full">
        <image href="/world.svg" x="0" y="0" height="400" width="800" />
        {points.map(([lon, lat], i) => {
          const cx = (lon + 180) * (800 / 360);
          const cy = (90 - lat) * (400 / 180);
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="5"
              fill="hsl(var(--accent))"
              stroke="hsl(var(--accent-foreground))"
              strokeWidth="1"
              className="animate-pulse"
            />
          );
        })}
      </svg>
    </div>
  );
}
