import * as React from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
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

export function LeadsDistributionChart({ data }: LeadsDistributionChartProps) {
  const totalLeads = React.useMemo(
    () => data.reduce((sum, event) => sum + event.leads, 0),
    [data]
  )

  if (data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base font-medium">Lead Distribution</CardTitle>
          <CardDescription className="text-xs">No events with leads found</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground text-sm">Create events and add leads to see distribution</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate top events for display
  const topEvents = data.slice(0, 5);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Lead Distribution</CardTitle>
            <CardDescription className="text-xs">By event</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{data.length} events</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Pie Chart */}
          <div className="w-32 h-32 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const percentage = ((payload[0].value as number / totalLeads) * 100).toFixed(1);
                      return (
                        <div className="rounded-lg bg-background p-2 shadow-sm border">
                          <p className="text-xs font-medium">{payload[0].name}</p>
                          <p className="text-sm font-bold">{payload[0].value} leads ({percentage}%)</p>
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
                  innerRadius={35}
                  outerRadius={55}
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`hsl(var(--primary) / ${1 - (index * 0.15)})`}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <div className="text-2xl font-bold">{totalLeads}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {topEvents.map((event, index) => {
              const percentage = Math.round((event.leads / totalLeads) * 100);
              return (
                <div key={event.eventId} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: `hsl(var(--primary) / ${1 - (index * 0.15)})` }}
                    />
                    <span className="truncate">{event.eventName}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="font-medium">{event.leads}</span>
                    <span className="text-muted-foreground text-xs">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
            {data.length > 5 && (
              <div className="text-xs text-muted-foreground italic">
                +{data.length - 5} more events
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}