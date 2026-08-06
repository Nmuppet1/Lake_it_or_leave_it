import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import { SWIM_METRICS, type Swim } from "@/lib/swims";

export function SwimRadar({ swim }: { swim: Swim }) {
  const data = SWIM_METRICS.map((metric) => ({
    metric: metric.label,
    value: Number(swim[metric.key] ?? 0),
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--border)" strokeOpacity={0.6} />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "currentColor", fontSize: 11 }}
            className="text-muted-foreground"
          />
          <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}