import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface KeyIndicatorProps {
  label: string;
  active: boolean;
  type: "buy" | "sell";
  threshold: number;
  currentValue: number;
}

export function KeyIndicator({ label, active, type, threshold, currentValue }: KeyIndicatorProps) {
  const isBuy = type === "buy";
  const percentage = Math.min((currentValue / threshold) * 100, 100);
  
  return (
    <div className={cn(
      "relative flex flex-col items-center justify-center p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300",
      active && isBuy && "border-[hsl(var(--color-buy))] shadow-[0_0_50px_-12px_hsl(var(--color-buy)/0.5)]",
      active && !isBuy && "border-[hsl(var(--color-sell))] shadow-[0_0_50px_-12px_hsl(var(--color-sell)/0.5)]"
    )}>
      {/* Background Fill Animation based on volume intensity */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 opacity-10 transition-all duration-200 ease-linear",
          isBuy ? "bg-[hsl(var(--color-buy))]" : "bg-[hsl(var(--color-sell))]"
        )}
        style={{ height: `${percentage}%` }}
      />

      <div className="relative z-10 text-center space-y-4">
        <h3 className="text-muted-foreground uppercase tracking-widest text-sm font-semibold">
          {isBuy ? "Buy Signal" : "Sell Signal"}
        </h3>
        
        <div className="relative">
          <motion.div
            animate={{
              scale: active ? 1.1 : 1,
              textShadow: active 
                ? `0 0 30px ${isBuy ? 'hsl(var(--color-buy))' : 'hsl(var(--color-sell))'}` 
                : "0 0 0px transparent"
            }}
            className={cn(
              "text-9xl font-display font-bold select-none transition-colors duration-100",
              active 
                ? (isBuy ? "text-[hsl(var(--color-buy))]" : "text-[hsl(var(--color-sell))]")
                : "text-muted-foreground/20"
            )}
          >
            {label}
          </motion.div>
          
          {/* Pulse Ring when active */}
          <AnimatePresence>
            {active && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className={cn(
                  "absolute inset-0 rounded-full border-4 opacity-0",
                  isBuy ? "border-[hsl(var(--color-buy))]" : "border-[hsl(var(--color-sell))]"
                )}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-1">
          <p className="font-mono text-2xl font-bold">
            {currentValue.toFixed(8)} <span className="text-sm font-normal text-muted-foreground">qty</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Threshold: {Number(threshold).toFixed(8)}
          </p>
        </div>
      </div>
    </div>
  );
}
