import { TrendingUp } from "lucide-react";
import { CartesianGrid, LabelList, Line, LineChart, XAxis, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface LeadsTimelineChartProps {
  data: Array<{
    month: string;
    leads: number;
  }>;
}

const chartConfig = {
  leads: {
    label: "Business Card Leads",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function LeadsTimelineChart({ data }: LeadsTimelineChartProps) {
  // Calculate growth percentage
  const lastMonth = data[data.length - 1]?.leads || 0;
  const previousMonth = data[data.length - 2]?.leads || 0;
  const growthPercentage = previousMonth > 0 
    ? ((lastMonth - previousMonth) / previousMonth * 100).toFixed(1)
    : 0;
  const isGrowing = Number(growthPercentage) > 0;
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Business Card Leads Timeline</CardTitle>
        <CardDescription>Monthly lead collection over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              top: 20,
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />
            <Line
              dataKey="leads"
              type="natural"
              stroke="var(--color-leads)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-leads)",
              }}
              activeDot={{
                r: 6,
              }}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {isGrowing ? (
            <>
              Trending up by {growthPercentage}% this month <TrendingUp className="h-4 w-4" />
            </>
          ) : (
            `${Math.abs(Number(growthPercentage))}% change from last month`
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          Total of {data.reduce((sum, item) => sum + item.leads, 0)} business card leads collected
        </div>
      </CardFooter>
    </Card>
  );
}