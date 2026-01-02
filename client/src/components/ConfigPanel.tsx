import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateConfiguration } from "@/hooks/use-configuration";
import { type Configuration, insertConfigurationSchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Loader2, Save, Activity, Zap, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Default configuration values matching schema defaults
const DEFAULT_CONFIGURATION = {
  symbol: "btcusdt",
  isActive: true,
  binanceBuyWeakMin: 0.00001,
  binanceBuyWeakMax: 0.00009999,
  binanceBuyWeakKey: "x",
  binanceBuyMedMin: 0.0001,
  binanceBuyMedMax: 0.00099999,
  binanceBuyMedKey: "c",
  binanceBuyStrongMin: 0.001,
  binanceBuyStrongMax: 0.00999999,
  binanceBuyStrongKey: "v",
  binanceSellWeakMin: 0.00001,
  binanceSellWeakMax: 0.00009999,
  binanceSellWeakKey: "y",
  binanceSellMedMin: 0.0001,
  binanceSellMedMax: 0.00099999,
  binanceSellMedKey: "u",
  binanceSellStrongMin: 0.001,
  binanceSellStrongMax: 0.00999999,
  binanceSellStrongKey: "i",
  coinbaseSymbol: "BTC-USD",
  coinbaseBuyWeakMin: 0.00001,
  coinbaseBuyWeakMax: 0.00009999,
  coinbaseBuyWeakKey: "a",
  coinbaseBuyMedMin: 0.0001,
  coinbaseBuyMedMax: 0.00099999,
  coinbaseBuyMedKey: "s",
  coinbaseBuyStrongMin: 0.001,
  coinbaseBuyStrongMax: 0.00999999,
  coinbaseBuyStrongKey: "d",
  coinbaseSellWeakMin: 0.00001,
  coinbaseSellWeakMax: 0.00009999,
  coinbaseSellWeakKey: "b",
  coinbaseSellMedMin: 0.0001,
  coinbaseSellMedMax: 0.00099999,
  coinbaseSellMedKey: "n",
  coinbaseSellStrongMin: 0.001,
  coinbaseSellStrongMax: 0.00999999,
  coinbaseSellStrongKey: "m",
  binanceSpecial1Min: 0.01,
  binanceSpecial1Max: 0.09999999,
  binanceSpecial1Signal: "buy" as const,
  binanceSpecial1Command: "g,h,x",
  binanceSpecial2Min: 0.1,
  binanceSpecial2Max: 0.99999999,
  binanceSpecial2Signal: "sell" as const,
  binanceSpecial2Command: "g,f,y",
  binanceSpecial3Min: 1.0,
  binanceSpecial3Max: 1000.0,
  binanceSpecial3Signal: "buy" as const,
  binanceSpecial3Command: "h,g,h,x",
  coinbaseSpecial1Min: 0.01,
  coinbaseSpecial1Max: 0.09999999,
  coinbaseSpecial1Signal: "buy" as const,
  coinbaseSpecial1Command: "l,k,a",
  coinbaseSpecial2Min: 0.1,
  coinbaseSpecial2Max: 0.99999999,
  coinbaseSpecial2Signal: "sell" as const,
  coinbaseSpecial2Command: "l,p,b",
  coinbaseSpecial3Min: 1.0,
  coinbaseSpecial3Max: 1000.0,
  coinbaseSpecial3Signal: "buy" as const,
  coinbaseSpecial3Command: "k,l,k,a",
};
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConfigPanelProps {
  config: Configuration;
}

const formSchema = insertConfigurationSchema.extend({
  binanceBuyWeakMin: z.coerce.number().min(0),
  binanceBuyWeakMax: z.coerce.number().min(0),
  binanceBuyMedMin: z.coerce.number().min(0),
  binanceBuyMedMax: z.coerce.number().min(0),
  binanceBuyStrongMin: z.coerce.number().min(0),
  binanceBuyStrongMax: z.coerce.number().min(0),
  binanceSellWeakMin: z.coerce.number().min(0),
  binanceSellWeakMax: z.coerce.number().min(0),
  binanceSellMedMin: z.coerce.number().min(0),
  binanceSellMedMax: z.coerce.number().min(0),
  binanceSellStrongMin: z.coerce.number().min(0),
  binanceSellStrongMax: z.coerce.number().min(0),
  coinbaseBuyWeakMin: z.coerce.number().min(0),
  coinbaseBuyWeakMax: z.coerce.number().min(0),
  coinbaseBuyMedMin: z.coerce.number().min(0),
  coinbaseBuyMedMax: z.coerce.number().min(0),
  coinbaseBuyStrongMin: z.coerce.number().min(0),
  coinbaseBuyStrongMax: z.coerce.number().min(0),
  coinbaseSellWeakMin: z.coerce.number().min(0),
  coinbaseSellWeakMax: z.coerce.number().min(0),
  coinbaseSellMedMin: z.coerce.number().min(0),
  coinbaseSellMedMax: z.coerce.number().min(0),
  coinbaseSellStrongMin: z.coerce.number().min(0),
  coinbaseSellStrongMax: z.coerce.number().min(0),
  binanceSpecial1Min: z.coerce.number().min(0),
  binanceSpecial1Max: z.coerce.number().min(0),
  binanceSpecial1Signal: z.enum(["buy", "sell"]),
  binanceSpecial1Command: z.string(),
  binanceSpecial2Min: z.coerce.number().min(0),
  binanceSpecial2Max: z.coerce.number().min(0),
  binanceSpecial2Signal: z.enum(["buy", "sell"]),
  binanceSpecial2Command: z.string(),
  binanceSpecial3Min: z.coerce.number().min(0),
  binanceSpecial3Max: z.coerce.number().min(0),
  binanceSpecial3Signal: z.enum(["buy", "sell"]),
  binanceSpecial3Command: z.string(),
  coinbaseSpecial1Min: z.coerce.number().min(0),
  coinbaseSpecial1Max: z.coerce.number().min(0),
  coinbaseSpecial1Signal: z.enum(["buy", "sell"]),
  coinbaseSpecial1Command: z.string(),
  coinbaseSpecial2Min: z.coerce.number().min(0),
  coinbaseSpecial2Max: z.coerce.number().min(0),
  coinbaseSpecial2Signal: z.enum(["buy", "sell"]),
  coinbaseSpecial2Command: z.string(),
  coinbaseSpecial3Min: z.coerce.number().min(0),
  coinbaseSpecial3Max: z.coerce.number().min(0),
  coinbaseSpecial3Signal: z.enum(["buy", "sell"]),
  coinbaseSpecial3Command: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export function ConfigPanel({ config }: ConfigPanelProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const updateConfig = useUpdateConfiguration();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symbol: config.symbol,
      isActive: config.isActive,
      binanceBuyWeakMin: Number(config.binanceBuyWeakMin),
      binanceBuyWeakMax: Number(config.binanceBuyWeakMax),
      binanceBuyWeakKey: config.binanceBuyWeakKey,
      binanceBuyMedMin: Number(config.binanceBuyMedMin),
      binanceBuyMedMax: Number(config.binanceBuyMedMax),
      binanceBuyMedKey: config.binanceBuyMedKey,
      binanceBuyStrongMin: Number(config.binanceBuyStrongMin),
      binanceBuyStrongMax: Number(config.binanceBuyStrongMax),
      binanceBuyStrongKey: config.binanceBuyStrongKey,
      binanceSellWeakMin: Number(config.binanceSellWeakMin),
      binanceSellWeakMax: Number(config.binanceSellWeakMax),
      binanceSellWeakKey: config.binanceSellWeakKey,
      binanceSellMedMin: Number(config.binanceSellMedMin),
      binanceSellMedMax: Number(config.binanceSellMedMax),
      binanceSellMedKey: config.binanceSellMedKey,
      binanceSellStrongMin: Number(config.binanceSellStrongMin),
      binanceSellStrongMax: Number(config.binanceSellStrongMax),
      binanceSellStrongKey: config.binanceSellStrongKey,
      coinbaseSymbol: config.coinbaseSymbol,
      coinbaseBuyWeakMin: Number(config.coinbaseBuyWeakMin),
      coinbaseBuyWeakMax: Number(config.coinbaseBuyWeakMax),
      coinbaseBuyWeakKey: config.coinbaseBuyWeakKey,
      coinbaseBuyMedMin: Number(config.coinbaseBuyMedMin),
      coinbaseBuyMedMax: Number(config.coinbaseBuyMedMax),
      coinbaseBuyMedKey: config.coinbaseBuyMedKey,
      coinbaseBuyStrongMin: Number(config.coinbaseBuyStrongMin),
      coinbaseBuyStrongMax: Number(config.coinbaseBuyStrongMax),
      coinbaseBuyStrongKey: config.coinbaseBuyStrongKey,
      coinbaseSellWeakMin: Number(config.coinbaseSellWeakMin),
      coinbaseSellWeakMax: Number(config.coinbaseSellWeakMax),
      coinbaseSellWeakKey: config.coinbaseSellWeakKey,
      coinbaseSellMedMin: Number(config.coinbaseSellMedMin),
      coinbaseSellMedMax: Number(config.coinbaseSellMedMax),
      coinbaseSellMedKey: config.coinbaseSellMedKey,
      coinbaseSellStrongMin: Number(config.coinbaseSellStrongMin),
      coinbaseSellStrongMax: Number(config.coinbaseSellStrongMax),
      coinbaseSellStrongKey: config.coinbaseSellStrongKey,
      binanceSpecial1Min: Number(config.binanceSpecial1Min),
      binanceSpecial1Max: Number(config.binanceSpecial1Max),
      binanceSpecial1Signal: config.binanceSpecial1Signal,
      binanceSpecial1Command: config.binanceSpecial1Command,
      binanceSpecial2Min: Number(config.binanceSpecial2Min),
      binanceSpecial2Max: Number(config.binanceSpecial2Max),
      binanceSpecial2Signal: config.binanceSpecial2Signal,
      binanceSpecial2Command: config.binanceSpecial2Command,
      binanceSpecial3Min: Number(config.binanceSpecial3Min),
      binanceSpecial3Max: Number(config.binanceSpecial3Max),
      binanceSpecial3Signal: config.binanceSpecial3Signal,
      binanceSpecial3Command: config.binanceSpecial3Command,
      coinbaseSpecial1Min: Number(config.coinbaseSpecial1Min),
      coinbaseSpecial1Max: Number(config.coinbaseSpecial1Max),
      coinbaseSpecial1Signal: config.coinbaseSpecial1Signal,
      coinbaseSpecial1Command: config.coinbaseSpecial1Command,
      coinbaseSpecial2Min: Number(config.coinbaseSpecial2Min),
      coinbaseSpecial2Max: Number(config.coinbaseSpecial2Max),
      coinbaseSpecial2Signal: config.coinbaseSpecial2Signal,
      coinbaseSpecial2Command: config.coinbaseSpecial2Command,
      coinbaseSpecial3Min: Number(config.coinbaseSpecial3Min),
      coinbaseSpecial3Max: Number(config.coinbaseSpecial3Max),
      coinbaseSpecial3Signal: config.coinbaseSpecial3Signal,
      coinbaseSpecial3Command: config.coinbaseSpecial3Command,
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        ...config,
        binanceBuyWeakMin: Number(config.binanceBuyWeakMin),
        binanceBuyWeakMax: Number(config.binanceBuyWeakMax),
        binanceBuyMedMin: Number(config.binanceBuyMedMin),
        binanceBuyMedMax: Number(config.binanceBuyMedMax),
        binanceBuyStrongMin: Number(config.binanceBuyStrongMin),
        binanceBuyStrongMax: Number(config.binanceBuyStrongMax),
        binanceSellWeakMin: Number(config.binanceSellWeakMin),
        binanceSellWeakMax: Number(config.binanceSellWeakMax),
        binanceSellMedMin: Number(config.binanceSellMedMin),
        binanceSellMedMax: Number(config.binanceSellMedMax),
        binanceSellStrongMin: Number(config.binanceSellStrongMin),
        binanceSellStrongMax: Number(config.binanceSellStrongMax),
        coinbaseBuyWeakMin: Number(config.coinbaseBuyWeakMin),
        coinbaseBuyWeakMax: Number(config.coinbaseBuyWeakMax),
        coinbaseBuyMedMin: Number(config.coinbaseBuyMedMin),
        coinbaseBuyMedMax: Number(config.coinbaseBuyMedMax),
        coinbaseBuyStrongMin: Number(config.coinbaseBuyStrongMin),
        coinbaseBuyStrongMax: Number(config.coinbaseBuyStrongMax),
        coinbaseSellWeakMin: Number(config.coinbaseSellWeakMin),
        coinbaseSellWeakMax: Number(config.coinbaseSellWeakMax),
        coinbaseSellMedMin: Number(config.coinbaseSellMedMin),
        coinbaseSellMedMax: Number(config.coinbaseSellMedMax),
        coinbaseSellStrongMin: Number(config.coinbaseSellStrongMin),
        coinbaseSellStrongMax: Number(config.coinbaseSellStrongMax),
        binanceSpecial1Min: Number(config.binanceSpecial1Min),
        binanceSpecial1Max: Number(config.binanceSpecial1Max),
        binanceSpecial1Signal: config.binanceSpecial1Signal,
        binanceSpecial1Command: config.binanceSpecial1Command,
        binanceSpecial2Min: Number(config.binanceSpecial2Min),
        binanceSpecial2Max: Number(config.binanceSpecial2Max),
        binanceSpecial2Signal: config.binanceSpecial2Signal,
        binanceSpecial2Command: config.binanceSpecial2Command,
        binanceSpecial3Min: Number(config.binanceSpecial3Min),
        binanceSpecial3Max: Number(config.binanceSpecial3Max),
        binanceSpecial3Signal: config.binanceSpecial3Signal,
        binanceSpecial3Command: config.binanceSpecial3Command,
        coinbaseSpecial1Min: Number(config.coinbaseSpecial1Min),
        coinbaseSpecial1Max: Number(config.coinbaseSpecial1Max),
        coinbaseSpecial1Signal: config.coinbaseSpecial1Signal,
        coinbaseSpecial1Command: config.coinbaseSpecial1Command,
        coinbaseSpecial2Min: Number(config.coinbaseSpecial2Min),
        coinbaseSpecial2Max: Number(config.coinbaseSpecial2Max),
        coinbaseSpecial2Signal: config.coinbaseSpecial2Signal,
        coinbaseSpecial2Command: config.coinbaseSpecial2Command,
        coinbaseSpecial3Min: Number(config.coinbaseSpecial3Min),
        coinbaseSpecial3Max: Number(config.coinbaseSpecial3Max),
        coinbaseSpecial3Signal: config.coinbaseSpecial3Signal,
        coinbaseSpecial3Command: config.coinbaseSpecial3Command,
      } as any);
    }
  }, [config, form]);

  async function onSubmit(values: FormValues) {
    try {
      await updateConfig.mutateAsync(values as any);
      toast({
        title: "Configuration updated",
        description: "Your settings have been saved and applied immediately.",
      });
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }

  const renderRangeFields = (prefix: string, label: string) => {
    const levels = [
      { id: "Weak", name: "Weak", color: "text-blue-400" },
      { id: "Med", name: "Medium", color: "text-yellow-400" },
      { id: "Strong", name: "Strong", color: "text-red-400" },
    ];

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">{label}</h4>
        {levels.map((level) => (
          <div key={level.id} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-secondary/20 border border-white/5">
            <div className={`col-span-1 text-[10px] font-bold uppercase ${level.color} flex items-end pb-2`}>{level.name}</div>
            <FormField
              control={form.control}
              name={`${prefix}${level.id}Min` as any}
              render={({ field }) => (
                <FormItem className="col-span-5">
                  <FormLabel className="text-[9px] uppercase font-bold text-muted-foreground/50">Min Qty</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.000000001" {...field} className="h-8 text-[10px] font-mono px-1 bg-black/20" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${prefix}${level.id}Max` as any}
              render={({ field }) => (
                <FormItem className="col-span-5">
                  <FormLabel className="text-[9px] uppercase font-bold text-muted-foreground/50">Max Qty</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.000000001" {...field} className="h-8 text-[10px] font-mono px-1 bg-black/20" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${prefix}${level.id}Key` as any}
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel className="text-[9px] uppercase font-bold text-muted-foreground/50">Key</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={1} className="h-8 text-[10px] font-mono px-1 bg-black/20 text-center uppercase" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderSpecialMoveFields = (prefix: string) => {
    const specials = [
      { id: "1", name: "Special 1", color: "text-purple-400" },
      { id: "2", name: "Special 2", color: "text-cyan-400" },
      { id: "3", name: "Special 3", color: "text-orange-400" },
    ];

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          Special Moves
        </h4>
        <p className="text-[10px] text-muted-foreground/60 -mt-2">
          Commands: "xxx" (rapid), "x,y,z" (sequence), "x+y" (simultaneous)
        </p>
        {specials.map((special) => (
          <div key={special.id} className="space-y-2 p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
            <div className={`text-[10px] font-bold uppercase ${special.color}`}>{special.name}</div>
            <div className="grid grid-cols-12 gap-2 items-end">
              <FormField
                control={form.control}
                name={`${prefix}Special${special.id}Min` as any}
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel className="text-[9px] uppercase font-bold text-muted-foreground/50">Min Qty</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.000000001" {...field} className="h-8 text-[11px] font-mono px-2 bg-black/20" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`${prefix}Special${special.id}Max` as any}
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel className="text-[9px] uppercase font-bold text-muted-foreground/50">Max Qty</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.000000001" {...field} className="h-8 text-[11px] font-mono px-2 bg-black/20" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`${prefix}Special${special.id}Signal` as any}
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-[9px] uppercase font-bold text-muted-foreground/50">Signal</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-[11px] bg-black/20">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`${prefix}Special${special.id}Command` as any}
                render={({ field }) => (
                  <FormItem className="col-span-4">
                    <FormLabel className="text-[9px] uppercase font-bold text-muted-foreground/50">Command</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="d,f,x" className="h-8 text-[11px] font-mono px-2 bg-black/20" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-secondary/50 border-white/10 hover:bg-secondary hover:text-white">
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0 bg-card border-border/40 shadow-2xl">
        <DialogHeader className="p-6 pb-4 bg-secondary/5 border-b">
          <DialogTitle className="text-xl font-display flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Street Fighter II Controller Configuration
          </DialogTitle>
          <DialogDescription>
            Map crypto trade quantities to arcade buttons. Set 9-decimal ranges for Weak, Medium, and Strong attacks.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-8">
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-semibold">Master Toggle</FormLabel>
                    <FormDescription>Enable or disable HID simulation</FormDescription>
                  </div>
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    )}
                  />
                </div>

                <Tabs defaultValue="binance" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="binance">Binance (P1)</TabsTrigger>
                    <TabsTrigger value="coinbase">Coinbase (P2)</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="binance" className="space-y-6 pt-4">
                    <FormField
                      control={form.control}
                      name="symbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>P1 Trading Pair</FormLabel>
                          <FormControl>
                            <Input {...field} className="font-mono uppercase" placeholder="btcusdt" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderRangeFields("binanceBuy", "P1 Punches (Buy Signal)")}
                      {renderRangeFields("binanceSell", "P1 Kicks (Sell Signal)")}
                    </div>
                    {renderSpecialMoveFields("binance")}
                  </TabsContent>

                  <TabsContent value="coinbase" className="space-y-6 pt-4">
                    <FormField
                      control={form.control}
                      name="coinbaseSymbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>P2 Trading Pair</FormLabel>
                          <FormControl>
                            <Input {...field} className="font-mono uppercase" placeholder="BTC-USD" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderRangeFields("coinbaseBuy", "P2 Punches (Buy Signal)")}
                      {renderRangeFields("coinbaseSell", "P2 Kicks (Sell Signal)")}
                    </div>
                    {renderSpecialMoveFields("coinbase")}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
            
            <DialogFooter className="p-6 bg-secondary/10 border-t gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => form.reset(DEFAULT_CONFIGURATION)}
                data-testid="button-restore-defaults"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore Defaults
              </Button>
              <div className="flex-1" />
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateConfig.isPending}>
                {updateConfig.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Configuration
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
