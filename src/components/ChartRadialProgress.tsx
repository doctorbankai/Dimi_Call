"use client"

import { PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart, Label } from "recharts"
import { ChartContainer, ChartStyle, type ChartConfig } from "@/components/ui/chart"

type Props = {
  value: number // 0..100
  size?: number // px, optional
  title?: string
}

const chartConfig = {
  progress: {
    label: "Progression",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ChartRadialProgress({ value, size = 36, title }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  const data = [{ name: "progress", progress: clamped, fill: "var(--color-progress)" }]

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-square"
      style={{ width: size, height: size }}
      title={title ?? `${clamped}%`}
    >
      <RadialBarChart
        data={data as any}
        startAngle={90}
        endAngle={-270}
        innerRadius={70}
        outerRadius={100}
      >
        <PolarGrid
          gridType="circle"
          radialLines={false}
          stroke="none"
          className="first:fill-muted last:fill-background"
          polarRadius={[86, 74]}
        />
        <RadialBar dataKey="progress" cornerRadius={10} background />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false} domain={[0, 100]}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-[10px] font-semibold">
                      {clamped}%
                    </tspan>
                  </text>
                )
              }
              return null
            }}
          />
        </PolarRadiusAxis>
      </RadialBarChart>
    </ChartContainer>
  )
}

