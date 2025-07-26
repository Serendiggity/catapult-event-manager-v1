import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer, YAxis } from "recharts";
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
  const isStable = Number(growthPercentage) === 0;
  
  // Calculate max value for Y axis
  const maxValue = Math.max(...data.map(d => d.leads));
  const yAxisMax = Math.ceil(maxValue * 1.2); // Add 20% padding
  
  return (
    <Card className="h-full border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Lead Collection Trend</CardTitle>
          <div className={`flex items-center gap-1 text-sm font-medium ${
            isGrowing ? 'text-green-600' : isStable ? 'text-gray-600' : 'text-red-600'
          }`}>
            {isGrowing ? (
              <>
                <TrendingUp className="h-4 w-4" />
                <span>+{growthPercentage}%</span>
              </>
            ) : isStable ? (
              <>
                <Minus className="h-4 w-4" />
                <span>0%</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4" />
                <span>{growthPercentage}%</span>
              </>
            )}
          </div>
        </div>
        <CardDescription>Business cards scanned per month</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: -20,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
                style={{ fontSize: '11px' }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                style={{ fontSize: '11px' }}
                stroke="hsl(var(--muted-foreground))"
                domain={[0, yAxisMax]}
                ticks={[0, Math.floor(yAxisMax/3), Math.floor(yAxisMax*2/3), yAxisMax]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  padding: '8px 12px',
                }}
                itemStyle={{
                  color: 'hsl(var(--foreground))',
                  fontSize: '12px',
                }}
                labelStyle={{
                  color: 'hsl(var(--muted-foreground))',
                  fontSize: '11px',
                  marginBottom: '4px',
                }}
                formatter={(value: number) => [`${value} leads`, '']}
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeOpacity: 0.2 }}
              />
              <Area
                type="monotone"
                dataKey="leads"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorLeads)"
                animationDuration={1000}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4, stroke: 'hsl(var(--background))' }}
                activeDot={{ r: 6, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-2xl font-semibold">{data.reduce((sum, item) => sum + item.leads, 0)}</span>
              <span className="text-xs text-muted-foreground">Total leads</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col">
              <span className="text-2xl font-semibold">{lastMonth}</span>
              <span className="text-xs text-muted-foreground">This month</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span>Last 6 months</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}