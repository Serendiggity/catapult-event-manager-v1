import * as React from "react"
import { Label, Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6b7280', // gray for "Others"
];

export function LeadsDistributionChart({ data }: LeadsDistributionChartProps) {
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
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-white p-2 shadow-sm">
                        <p className="text-sm font-medium">{payload[0].name}</p>
                        <p className="text-sm text-gray-600">
                          {payload[0].value} leads
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={data}
                dataKey="leads"
                nameKey="eventName"
                cx="50%"
                cy="50%"
                innerRadius={60}
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
        
        {/* Legend - Show only top 5 + Others in legend */}
        <div className="mt-4 space-y-1">
          {data.slice(0, 6).map((event, index) => (
            <div key={event.eventId} className="flex items-center gap-2 text-sm">
              <div
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: event.eventId === 'others' ? '#6b7280' : COLORS[index % COLORS.length] }}
              />
              <span className="truncate text-xs text-muted-foreground">
                {event.eventName} ({event.leads} leads)
              </span>
            </div>
          ))}
          {data.length > 6 && (
            <p className="text-xs text-muted-foreground italic mt-2">
              Showing top events only
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}