import { useConfiguration } from "@/hooks/use-configuration";
import { useBinanceSocket } from "@/hooks/use-binance-socket";
import { useCoinbaseSocket } from "@/hooks/use-coinbase-socket";
import { ConfigPanel } from "@/components/ConfigPanel";
import { KeyIndicator } from "@/components/KeyIndicator";
import { VolumeChart } from "@/components/VolumeChart";
import { Activity, AlertTriangle, Cpu, Terminal, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: config, isLoading: configLoading, error: configError } = useConfiguration();
  
  const { data: binanceData, status: binanceStatus } = useBinanceSocket(
    config?.symbol || "", 
    config?.isActive
  );

  const { data: coinbaseData, status: coinbaseStatus } = useCoinbaseSocket(
    config?.coinbaseSymbol || "", 
    config?.isActive
  );

  if (configLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader />
        <p className="text-muted-foreground animate-pulse">Initializing System...</p>
      </div>
    );
  }

  if (configError || !config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card p-8 rounded-2xl border border-destructive/20 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">System Error</h2>
          <p className="text-muted-foreground">Failed to load configuration. Please ensure the backend server is running.</p>
        </div>
      </div>
    );
  }

  const checkActive = (val: number, min: string | number, max: string | number) => {
    return config.isActive && val >= Number(min) && val <= Number(max);
  };

  const renderPlayerControls = (
    player: string,
    data: any,
    prefix: "binanceBuy" | "binanceSell" | "coinbaseBuy" | "coinbaseSell"
  ) => {
    const isP1 = player === "P1";
    const type = prefix.toLowerCase().includes("buy") ? "buy" : "sell";
    const label = type === "buy" ? "Punches" : "Kicks";
    
    return (
      <div className="space-y-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          {player} {label}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <KeyIndicator 
            label={config[`${prefix}WeakKey` as keyof typeof config] as string}
            active={checkActive(data[`${type}Quantity`], config[`${prefix}WeakMin`], config[`${prefix}WeakMax`])}
            type={type}
            min={Number(config[`${prefix}WeakMin`])}
            max={Number(config[`${prefix}WeakMax`])}
            currentValue={data[`${type}Quantity`]}
          />
          <KeyIndicator 
            label={config[`${prefix}MedKey` as keyof typeof config] as string}
            active={checkActive(data[`${type}Quantity`], config[`${prefix}MedMin`], config[`${prefix}MedMax`])}
            type={type}
            min={Number(config[`${prefix}MedMin`])}
            max={Number(config[`${prefix}MedMax`])}
            currentValue={data[`${type}Quantity`]}
          />
          <KeyIndicator 
            label={config[`${prefix}StrongKey` as keyof typeof config] as string}
            active={checkActive(data[`${type}Quantity`], config[`${prefix}StrongMin`], config[`${prefix}StrongMax`])}
            type={type}
            min={Number(config[`${prefix}StrongMin`])}
            max={Number(config[`${prefix}StrongMax`])}
            currentValue={data[`${type}Quantity`]}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 p-4 md:p-6 flex flex-col gap-4">
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card/30 backdrop-blur-md border border-white/5 p-4 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-800 flex items-center justify-center shadow-lg shadow-primary/20">
            <Cpu className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold tracking-tight">SF2 Crypto Bridge</h1>
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
              <span className="uppercase">P1: {config.symbol}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="uppercase">P2: {config.coinbaseSymbol}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 border border-white/5">
            <Wifi className={cn(
              "w-2 h-2 transition-colors", 
              binanceStatus === 'connected' && coinbaseStatus === 'connected' ? "text-green-500" : "text-red-500"
            )} />
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              B: {binanceStatus} | C: {coinbaseStatus}
            </span>
          </div>
          <ConfigPanel config={config} />
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-4 flex flex-col">
          <div className="bg-card rounded-2xl p-4 border border-white/5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-3 h-3" />
                Live Streams
              </h3>
              <Badge variant={config.isActive ? "default" : "secondary"} className="uppercase text-[8px]">
                {config.isActive ? "Active" : "Paused"}
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground/60">
                  <span>Binance {config.symbol}</span>
                  <span>${binanceData.lastPrice.toLocaleString()}</span>
                </div>
                <div className="h-20 w-full bg-black/20 rounded-lg overflow-hidden border border-white/5">
                  <VolumeChart 
                    currentData={binanceData} 
                    buyColor="hsl(var(--color-buy))"
                    sellColor="hsl(var(--color-sell))"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground/60">
                  <span>Coinbase {config.coinbaseSymbol}</span>
                </div>
                <div className="h-20 w-full bg-black/20 rounded-lg overflow-hidden border border-white/5">
                  <VolumeChart 
                    currentData={coinbaseData} 
                    buyColor="hsl(var(--color-buy))"
                    sellColor="hsl(var(--color-sell))"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4">
             <div className="flex gap-3">
               <Terminal className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
               <div className="space-y-1">
                 <h4 className="text-xs font-bold text-orange-500 uppercase">Bridge Active</h4>
                 <p className="text-[10px] text-orange-200/50 leading-tight">
                   The Python bridge is receiving these triggers via WebSocket.
                 </p>
               </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4 p-4 rounded-2xl bg-card/20 border border-white/5">
            <div className="text-xs font-bold uppercase tracking-widest text-primary/80">Player 1 (Binance)</div>
            <div className="space-y-6">
              {renderPlayerControls("P1", binanceData, "binanceBuy")}
              {renderPlayerControls("P1", binanceData, "binanceSell")}
            </div>
          </div>
          
          <div className="space-y-4 p-4 rounded-2xl bg-card/20 border border-white/5">
            <div className="text-xs font-bold uppercase tracking-widest text-purple-400">Player 2 (Coinbase)</div>
            <div className="space-y-6">
              {renderPlayerControls("P2", coinbaseData, "coinbaseBuy")}
              {renderPlayerControls("P2", coinbaseData, "coinbaseSell")}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Loader() {
  return (
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
      <div className="absolute inset-0 border-2 border-t-primary rounded-full animate-spin"></div>
    </div>
  );
}
