"use client"
import { Sun, Wind, Waves, ShieldAlert, GitMerge, Signal, LineChart, Zap } from "lucide-react";
import { EventType } from "@/lib/types";

const eventTypeIcons: Record<EventType, React.ReactNode> = {
  GST: <Zap />,
  IPS: <Waves />,
  FLR: <Sun />,
  SEP: <ShieldAlert />,
  MPC: <GitMerge />,
  RBE: <Signal />,
  HSS: <Wind />,
  WSA: <LineChart />,
};

export function EventTypeIcon({ type }: { type: EventType }) {
  const Icon = eventTypeIcons[type];
  return <span className="text-accent">{Icon}</span>;
}
