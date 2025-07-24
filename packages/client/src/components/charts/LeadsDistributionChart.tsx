import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import { PieSectorDataItem } from "recharts/types/polar/Pie"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  const id = "leads-distribution"
  const [activeEvent, setActiveEvent] = React.useState(data[0]?.eventId || '')

  const activeIndex = React.useMemo(
    () => data.findIndex((item) => item.eventId === activeEvent),
    [activeEvent, data]
  )

  // Generate chart config from data
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      leads: {
        label: "Leads",
      },
    }
    
    data.forEach((event, index) => {
      config[event.eventId] = {
        label: event.eventName,
        color: `var(--chart-${(index % 5) + 1})`,
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
      <Card>
        <CardHeader>
          <CardTitle>Lead Distribution by Event</CardTitle>
          <CardDescription>No events with leads found</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Create events and add leads to see distribution</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card data-chart={id} className="flex flex-col">
      <ChartStyle id={id} config={chartConfig} />
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle>Lead Distribution by Event</CardTitle>
          <CardDescription>Total: {totalLeads} leads across {data.length} events</CardDescription>
        </div>
        <Select value={activeEvent} onValueChange={setActiveEvent}>
          <SelectTrigger
            className="ml-auto h-7 w-[180px] rounded-lg pl-2.5"
            aria-label="Select an event"
          >
            <SelectValue placeholder="Select event" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl">
            {data.map((event, index) => (
              <SelectItem
                key={event.eventId}
                value={event.eventId}
                className="rounded-lg [&_span]:flex"
              >
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className="flex h-3 w-3 shrink-0 rounded-sm"
                    style={{
                      backgroundColor: `var(--chart-${(index % 5) + 1})`,
                    }}
                  />
                  <span className="truncate max-w-[150px]">{event.eventName}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0">
        <ChartContainer
          id={id}
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="leads"
              nameKey="eventName"
              innerRadius={60}
              strokeWidth={5}
              activeIndex={activeIndex}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <g>
                  <Sector {...props} outerRadius={outerRadius + 10} />
                  <Sector
                    {...props}
                    outerRadius={outerRadius + 25}
                    innerRadius={outerRadius + 12}
                  />
                </g>
              )}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    const selectedEvent = data[activeIndex]
                    const percentage = ((selectedEvent?.leads || 0) / totalLeads * 100).toFixed(1)
                    
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {selectedEvent?.leads.toLocaleString() || 0}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Leads ({percentage}%)
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}