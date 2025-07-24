import * as React from "react"
import { Label, Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Sector } from "recharts"

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
];

export function LeadsDistributionChart({ data }: LeadsDistributionChartProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);

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

  const activeEvent = data[activeIndex];

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
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    style={{ 
                      cursor: 'pointer',
                      filter: activeIndex === index ? 'brightness(1.1)' : 'brightness(1)',
                      transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                      transformOrigin: 'center'
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                  />
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
                          dy="-0.4em"
                          style={{ fontSize: '28px', fontWeight: 'bold' }}
                        >
                          {activeEvent?.leads || totalLeads}
                        </tspan>
                        <tspan
                          x="50%"
                          dy="1.4em"
                          style={{ fontSize: '14px', opacity: 0.7 }}
                        >
                          {activeEvent?.eventName || 'Total Leads'}
                        </tspan>
                      </text>
                    )
                  }}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Interactive Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.map((event, index) => (
            <div 
              key={event.eventId} 
              className={`flex items-center gap-2 text-sm cursor-pointer transition-opacity ${
                activeIndex === index ? 'opacity-100' : 'opacity-60 hover:opacity-80'
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
            >
              <div
                className="h-3 w-3 rounded-sm shrink-0 transition-transform"
                style={{ 
                  backgroundColor: COLORS[index % COLORS.length],
                  transform: activeIndex === index ? 'scale(1.2)' : 'scale(1)'
                }}
              />
              <span className="truncate text-xs">{event.eventName} ({event.leads})</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}