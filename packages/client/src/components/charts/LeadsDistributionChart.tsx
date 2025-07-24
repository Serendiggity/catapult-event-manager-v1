import * as React from "react"
import { Label, Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import {
  ChartContainer,
  ChartStyle,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface EventData {
  eventId: string;
  eventName: string;
  leads: number;
  fill: string;
}

interface LeadsDistributionChartProps {
  data: EventData[];
}

const COLORS = [
  'hsl(220, 70%, 50%)',
  'hsl(160, 60%, 45%)', 
  'hsl(30, 80%, 55%)',
  'hsl(280, 65%, 60%)',
  'hsl(340, 75%, 55%)',
  'hsl(200, 70%, 45%)',
  'hsl(120, 60%, 40%)',
  'hsl(60, 70%, 50%)',
];

export function LeadsDistributionChart({ data }: LeadsDistributionChartProps) {
  const id = "leads-distribution"

  // Generate chart config from data
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      leads: {
        label: "Leads",
      },
    }
    
    data.forEach((event) => {
      config[event.eventId] = {
        label: event.eventName,
      }
    })
    
    return config
  }, [data])

  const totalLeads = React.useMemo(
    () => data.reduce((sum, event) => sum + event.leads, 0),
    [data]
  )

  if (data.length === 0) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Lead Distribution</CardTitle>
          <CardDescription>No events with leads found</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground text-sm">Create events and add leads to see distribution</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <CardTitle>Lead Distribution</CardTitle>
        <CardDescription>{data.length} events</CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="mx-auto aspect-square w-full max-h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                cursor={false}
                content={<ChartTooltipContent />}
              />
              <Pie
                data={data}
                dataKey="leads"
                nameKey="eventName"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                strokeWidth={2}
                stroke="#ffffff"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <Label
                  position="center"
                  content={() => {
                    return (
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-current"
                      >
                        <tspan
                          x="50%"
                          dy="-0.2em"
                          style={{ fontSize: '24px', fontWeight: 'bold' }}
                        >
                          {totalLeads}
                        </tspan>
                        <tspan
                          x="50%"
                          dy="1.5em"
                          style={{ fontSize: '14px', opacity: 0.7 }}
                        >
                          Total Leads
                        </tspan>
                      </text>
                    )
                  }}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.map((event, index) => (
            <div key={event.eventId} className="flex items-center gap-2 text-sm">
              <div
                className="h-3 w-3 rounded-sm shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="truncate text-xs">{event.eventName} ({event.leads})</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}