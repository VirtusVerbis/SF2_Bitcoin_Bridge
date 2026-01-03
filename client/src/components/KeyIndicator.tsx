import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface KeyIndicatorProps {
  label: string;
  active: boolean;
  type: "buy" | "sell";
  min: number;
  max: number;
  currentValue: number;
}

export function KeyIndicator({ label, active, type, min, max, currentValue }: KeyIndicatorProps) {
  const isBuy = type === "buy";
  
  // Calculate percentage within the specific range
  const range = max - min;
  const progressInRange = Math.max(0, currentValue - min);
  const percentage = range > 0 ? Math.min((progressInRange / range) * 100, 100) : (currentValue >= min ? 100 : 0);
  
  return (
    <div className={cn(
      "relative flex flex-col items-center justify-center p-3 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300",
      active && isBuy && "border-[hsl(var(--color-buy))] shadow-[0_0_30px_-12px_hsl(var(--color-buy)/0.5)]",
      active && !isBuy && "border-[hsl(var(--color-sell))] shadow-[0_0_30px_-12px_hsl(var(--color-sell)/0.5)]"
    )}>
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 opacity-10 transition-all duration-200 ease-linear",
          isBuy ? "bg-[hsl(var(--color-buy))]" : "bg-[hsl(var(--color-sell))]"
        )}
        style={{ height: `${percentage}%` }}
      />

      <div className="relative z-10 text-center space-y-1 w-full">
        <div className="relative h-14 flex items-center justify-center">
          <motion.div
            animate={{
              scale: active ? 1.1 : 1,
              textShadow: active 
                ? `0 0 20px ${isBuy ? 'hsl(var(--color-buy))' : 'hsl(var(--color-sell))'}` 
                : "0 0 0px transparent"
            }}
            className={cn(
              "text-5xl font-display font-bold select-none transition-colors duration-100",
              active 
                ? (isBuy ? "text-[hsl(var(--color-buy))]" : "text-[hsl(var(--color-sell))]")
                : "text-muted-foreground/20"
            )}
          >
            {label}
          </motion.div>
          
          <AnimatePresence>
            {active && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className={cn(
                  "absolute inset-0 rounded-full border-2 opacity-0",
                  isBuy ? "border-[hsl(var(--color-buy))]" : "border-[hsl(var(--color-sell))]"
                )}
              />
            )}
          </AnimatePresence>
        </div>

        <p className="font-mono text-xs text-muted-foreground">
          {Number(currentValue || 0).toFixed(8)}
        </p>
      </div>
    </div>
  );
}
