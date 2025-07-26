import { TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
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
  // Calculate statistics
  const totalLeads = data.reduce((sum, item) => sum + item.leads, 0);
  const averageLeads = Math.round(totalLeads / data.length);
  const lastMonth = data[data.length - 1]?.leads || 0;
  const previousMonth = data[data.length - 2]?.leads || 0;
  const growthPercentage = previousMonth > 0 
    ? ((lastMonth - previousMonth) / previousMonth * 100).toFixed(1)
    : 0;
  const isGrowing = Number(growthPercentage) > 0;
  
  // Find max for highlighting
  const maxLeads = Math.max(...data.map(d => d.leads));
  
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Monthly Leads</CardTitle>
            <CardDescription className="text-xs">Business cards scanned</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{totalLeads}</div>
            <div className="text-xs text-muted-foreground">Total collected</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                className="text-xs"
                width={40}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg bg-background p-2 shadow-sm border">
                        <p className="text-xs font-medium">{payload[0].payload.month}</p>
                        <p className="text-sm font-bold">{payload[0].value} leads</p>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: 'transparent' }}
              />
              <Bar
                dataKey="leads"
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.leads === maxLeads ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-row items-center justify-between border-t pt-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Average</p>
            <p className="text-sm font-medium">{averageLeads}/month</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xs text-muted-foreground">This month</p>
            <p className="text-sm font-medium">{lastMonth} leads</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-sm ${
          isGrowing ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
        }`}>
          {isGrowing ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span className="font-medium">{growthPercentage}%</span>
        </div>
      </CardFooter>
    </Card>
  );
}