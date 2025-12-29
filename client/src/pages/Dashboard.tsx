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

  // Binance thresholds and active states
  const buyThresholdNum = config?.buyThreshold ? Number(config.buyThreshold) : Infinity;
  const sellThresholdNum = config?.sellThreshold ? Number(config.sellThreshold) : Infinity;
  const isBinanceBuyActive = config?.isActive && binanceData.buyQuantity >= buyThresholdNum;
  const isBinanceSellActive = config?.isActive && binanceData.sellQuantity >= sellThresholdNum;

  // Coinbase thresholds and active states
  const coinbaseBuyThresholdNum = config?.coinbaseBuyThreshold ? Number(config.coinbaseBuyThreshold) : Infinity;
  const coinbaseSellThresholdNum = config?.coinbaseSellThreshold ? Number(config.coinbaseSellThreshold) : Infinity;
  const isCoinbaseBuyActive = config?.isActive && coinbaseData.buyQuantity >= coinbaseBuyThresholdNum;
  const isCoinbaseSellActive = config?.isActive && coinbaseData.sellQuantity >= coinbaseSellThresholdNum;

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

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 p-4 md:p-8 flex flex-col gap-6">
      
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card/30 backdrop-blur-md border border-white/5 p-4 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-800 flex items-center justify-center shadow-lg shadow-primary/20">
            <Cpu className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold tracking-tight">MAME Controller</h1>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="uppercase">{config.symbol}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>{binanceData.lastPrice > 0 ? `$${binanceData.lastPrice.toLocaleString()}` : '---'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-white/5">
            <Wifi className={cn(
              "w-3 h-3 transition-colors", 
              binanceStatus === 'connected' && coinbaseStatus === 'connected' ? "text-green-500" : "text-red-500"
            )} />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Binance: {binanceStatus} | Coinbase: {coinbaseStatus}
            </span>
          </div>
          <ConfigPanel config={config} />
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Status & Chart */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          {/* Status Card */}
          <div className="bg-card rounded-3xl p-6 border border-white/5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Stream Activity
              </h3>
              <Badge variant={config.isActive ? "default" : "secondary"} className="uppercase text-[10px]">
                {config.isActive ? "Active" : "Paused"}
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Binance {config.symbol.toUpperCase()}</h4>
                <div className="h-[100px] w-full bg-black/20 rounded-xl overflow-hidden border border-white/5 relative">
                  <VolumeChart 
                    currentData={binanceData} 
                    buyColor="hsl(var(--color-buy))"
                    sellColor="hsl(var(--color-sell))"
                  />
                  <div className="absolute top-1 right-1 text-[9px] font-mono text-white/30">500ms</div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                    <p className="text-xs text-muted-foreground mb-0.5">Buy Qty</p>
                    <p className="font-mono text-sm text-[hsl(var(--color-buy))]">
                      {binanceData.buyQuantity.toFixed(8)}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                    <p className="text-xs text-muted-foreground mb-0.5">Sell Qty</p>
                    <p className="font-mono text-sm text-[hsl(var(--color-sell))]">
                      {binanceData.sellQuantity.toFixed(8)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Coinbase {config.coinbaseSymbol}</h4>
                <div className="h-[100px] w-full bg-black/20 rounded-xl overflow-hidden border border-white/5 relative">
                  <VolumeChart 
                    currentData={coinbaseData} 
                    buyColor="hsl(var(--color-buy))"
                    sellColor="hsl(var(--color-sell))"
                  />
                  <div className="absolute top-1 right-1 text-[9px] font-mono text-white/30">500ms</div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                    <p className="text-xs text-muted-foreground mb-0.5">Buy Qty</p>
                    <p className="font-mono text-sm text-[hsl(var(--color-buy))]">
                      {coinbaseData.buyQuantity.toFixed(8)}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                    <p className="text-xs text-muted-foreground mb-0.5">Sell Qty</p>
                    <p className="font-mono text-sm text-[hsl(var(--color-sell))]">
                      {coinbaseData.sellQuantity.toFixed(8)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Card */}
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-3xl p-6 flex-1">
             <div className="flex gap-3">
               <Terminal className="w-5 h-5 text-orange-500 shrink-0 mt-1" />
               <div className="space-y-2">
                 <h4 className="font-bold text-orange-500">Desktop Bridge Required</h4>
                 <p className="text-sm text-orange-200/70 leading-relaxed">
                   This dashboard visualizes triggers only. Browsers cannot simulate global key presses for MAME.
                 </p>
                 <p className="text-sm text-orange-200/70 leading-relaxed">
                   Run the Python companion script to forward these events to your OS.
                 </p>
                 <code className="block mt-3 p-3 bg-black/30 rounded-lg text-xs font-mono text-orange-300 break-all">
                   python bridge.py --endpoint ws://localhost:5000/api/stream
                 </code>
               </div>
             </div>
          </div>
        </div>

        {/* Right Col: Big Indicators */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="text-xs font-semibold text-muted-foreground">Binance Triggers</div>
            <div className="grid grid-cols-1 gap-4">
              <KeyIndicator 
                label={config.buyKey} 
                active={isBinanceBuyActive} 
                type="buy"
                threshold={buyThresholdNum}
                currentValue={binanceData.buyQuantity}
              />
              <KeyIndicator 
                label={config.sellKey} 
                active={isBinanceSellActive} 
                type="sell"
                threshold={sellThresholdNum}
                currentValue={binanceData.sellQuantity}
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="text-xs font-semibold text-muted-foreground">Coinbase Triggers</div>
            <div className="grid grid-cols-1 gap-4">
              <KeyIndicator 
                label={config.coinbaseBuyKey} 
                active={isCoinbaseBuyActive} 
                type="buy"
                threshold={coinbaseBuyThresholdNum}
                currentValue={coinbaseData.buyQuantity}
              />
              <KeyIndicator 
                label={config.coinbaseSellKey} 
                active={isCoinbaseSellActive} 
                type="sell"
                threshold={coinbaseSellThresholdNum}
                currentValue={coinbaseData.sellQuantity}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Loader() {
  return (
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
    </div>
  );
}
