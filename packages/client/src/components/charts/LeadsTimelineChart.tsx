import { TrendingUp } from "lucide-react";
import { CartesianGrid, LabelList, Line, LineChart, XAxis, Tooltip, ResponsiveContainer, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LeadsTimelineChartProps {
  data: Array<{
    month: string;
    leads: number;
  }>;
}

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
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: number) => [`${value} leads`, 'Leads']}
              />
              <Line
                dataKey="leads"
                type="monotone"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{
                  fill: "hsl(var(--primary))",
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
              >
                <LabelList
                  position="top"
                  offset={12}
                  style={{ fontSize: '12px', fill: 'hsl(var(--foreground))' }}
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
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