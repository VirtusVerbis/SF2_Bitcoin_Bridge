import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { useEffect, useState } from "react";
import { VolumeData } from "@/hooks/use-binance-socket";

interface VolumeChartProps {
  currentData: VolumeData;
  buyColor: string;
  sellColor: string;
}

interface ChartDataPoint {
  time: number;
  buy: number;
  sell: number;
}

export function VolumeChart({ currentData, buyColor, sellColor }: VolumeChartProps) {
  const [history, setHistory] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    setHistory(prev => {
      const newPoint = {
        time: Date.now(),
        buy: currentData.buyQuantity,
        sell: currentData.sellQuantity
      };
      // Keep last 50 points (approx 25 seconds of data at 500ms update rate)
      const newHistory = [...prev, newPoint];
      if (newHistory.length > 50) return newHistory.slice(-50);
      return newHistory;
    });
  }, [currentData]);

  if (history.length < 2) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm animate-pulse">
        Waiting for trade data...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={history}>
        <defs>
          <linearGradient id="colorBuy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={buyColor} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={buyColor} stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorSell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={sellColor} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={sellColor} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <YAxis hide domain={[0, 'auto']} />
        <Area 
          type="monotone" 
          dataKey="buy" 
          stroke={buyColor} 
          fillOpacity={1} 
          fill="url(#colorBuy)" 
          strokeWidth={2}
          isAnimationActive={false}
        />
        <Area 
          type="monotone" 
          dataKey="sell" 
          stroke={sellColor} 
          fillOpacity={1} 
          fill="url(#colorSell)" 
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
