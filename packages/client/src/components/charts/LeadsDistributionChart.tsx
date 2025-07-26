import * as React from "react"
import { Label, Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Legend } from "recharts"
import { Users } from "lucide-react"

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
  'hsl(221, 83%, 53%)',  // blue
  'hsl(160, 84%, 39%)',  // emerald
  'hsl(38, 92%, 50%)',   // amber
  'hsl(262, 83%, 58%)',  // violet
  'hsl(0, 84%, 60%)',    // red
  'hsl(189, 94%, 43%)',  // cyan
  'hsl(84, 81%, 44%)',   // lime
  'hsl(25, 95%, 53%)',   // orange
  'hsl(220, 9%, 46%)',   // gray for "Others"
];

export function LeadsDistributionChart({ data }: LeadsDistributionChartProps) {
  const totalLeads = React.useMemo(
    () => data.reduce((sum, event) => sum + event.leads, 0),
    [data]
  )

  if (data.length === 0) {
    return (
      <Card className="h-full border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Lead Distribution</CardTitle>
          <CardDescription>No events with leads found</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground text-sm">Create events and add leads to see distribution</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate top events for display
  const topEvents = data.slice(0, 5);
  const topEventsTotal = topEvents.reduce((sum, event) => sum + event.leads, 0);
  const topEventsPercentage = Math.round((topEventsTotal / totalLeads) * 100);

  return (
    <Card className="h-full border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Lead Distribution</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{data.length} events</span>
          </div>
        </div>
        <CardDescription>Leads by event</CardDescription>
      </CardHeader>
      <CardContent className="pb-4 pt-4">
        <div className="mx-auto aspect-square w-full max-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {COLORS.map((color, index) => (
                  <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.9}/>
                    <stop offset="100%" stopColor={color} stopOpacity={1}/>
                  </linearGradient>
                ))}
              </defs>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const percentage = ((payload[0].value as number / totalLeads) * 100).toFixed(1);
                    return (
                      <div className="rounded-lg bg-background/95 backdrop-blur-sm p-3 shadow-lg border">
                        <p className="text-sm font-medium">{payload[0].name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-semibold">{payload[0].value}</span>
                          <span className="text-sm text-muted-foreground">leads ({percentage}%)</span>
                        </div>
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
                innerRadius={55}
                outerRadius={85}
                strokeWidth={0}
                animationBegin={0}
                animationDuration={800}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#gradient-${index % COLORS.length})`}
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' }}
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
                          dy="-0.2em"
                          style={{ fontSize: '28px', fontWeight: '700' }}
                        >
                          {totalLeads}
                        </tspan>
                        <tspan
                          x="50%"
                          dy="1.3em"
                          style={{ fontSize: '12px', opacity: 0.6 }}
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
        
        {/* Enhanced Legend */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Top {topEvents.length} events</span>
            <span>{topEventsPercentage}% of total</span>
          </div>
          {topEvents.map((event, index) => {
            const percentage = Math.round((event.leads / totalLeads) * 100);
            return (
              <div key={event.eventId} className="group">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="h-3 w-3 rounded-sm shrink-0 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm truncate">{event.eventName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{event.leads}</span>
                    <span className="text-muted-foreground">({percentage}%)</span>
                  </div>
                </div>
                <div className="mt-1 ml-5">
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500 ease-out rounded-full"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                        opacity: 0.3
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {data.length > 5 && (
            <div className="pt-2 text-xs text-muted-foreground italic flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-muted" />
              <span>+{data.length - 5} more events</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}