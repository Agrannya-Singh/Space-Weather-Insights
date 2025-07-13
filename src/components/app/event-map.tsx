
"use client"

import { useMemo } from "react";
import { DonkiEvent } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";

function parseLocation(location: string): [number, number] | null {
  if (!location) return null;
  // For locations like 'S14W01' or 'N22E12'
  const flrMatch = location.match(/([NS])(\d+)([WE])(\d+)/);
  if (flrMatch) {
    const [, latDir, latStr, lonDir, lonStr] = flrMatch;
    let latitude = parseInt(latStr, 10);
    let longitude = parseInt(lonStr, 10);
    if (latDir === 'S') latitude = -latitude;
    if (lonDir === 'W') longitude = -longitude;
    // Keep longitude within -180 to 180 range
    if (longitude > 180) longitude = 180;
    if (longitude < -180) longitude = -180;
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
      <svg viewBox="0 0 800 400" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <path d="M799.5 200c0 110.5-89.5 200-200 200s-200-89.5-200-200 89.5-200 200-200 200 89.5 200 200z" fill="#333" />
        <circle cx="400" cy="200" r="199.5" fill="#000" stroke="#666" strokeWidth="1" />
        <g fill="none" stroke="#fff" strokeWidth="0.5">
          {Array.from({length: 17}).map((_, i) => (
            <circle key={`lon-${i}`} cx="400" cy="200" r={(i+1)*200/18} />
          ))}
          {Array.from({length: 12}).map((_, i) => (
            <line key={`lat-${i}`} x1="400" y1="0" x2="400" y2="400" transform={`rotate(${i*30}, 400, 200)`} />
          ))}
        </g>
        {points.map(([lon, lat], i) => {
          const r = Math.cos(lat * Math.PI / 180) * 199.5;
          const x = 400 + r * Math.cos((lon-90) * Math.PI / 180);
          const y = 200 + r * Math.sin((lon-90) * Math.PI / 180);
          
          const z = Math.sin(lat * Math.PI / 180) * 199.5;

          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={z > 0 ? 5 : 2}
              fill={z > 0 ? "hsl(var(--accent))" : "hsl(var(--muted))"}
              stroke="hsl(var(--accent-foreground))"
              strokeWidth="1"
              className="animate-pulse"
              style={{ animationDelay: `${i * 100}ms`}}
            />
          );
        })}
         <text x="400" y="20" fill="hsl(var(--muted-foreground))" textAnchor="middle" fontSize="12">Solar Flares and CMEs</text>
      </svg>
    </div>
  );
}
