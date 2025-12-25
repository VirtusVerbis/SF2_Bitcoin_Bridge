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
import { Settings, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConfigPanelProps {
  config: Configuration;
}

// We need to extend the schema for the form because input type="number" returns strings
const formSchema = insertConfigurationSchema.extend({
  buyThreshold: z.coerce.number().min(1),
  sellThreshold: z.coerce.number().min(1),
});

export function ConfigPanel({ config }: ConfigPanelProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const updateConfig = useUpdateConfiguration();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symbol: config.symbol,
      buyThreshold: config.buyThreshold,
      sellThreshold: config.sellThreshold,
      buyKey: config.buyKey,
      sellKey: config.sellKey,
      isActive: config.isActive,
    },
  });

  // Reset form when config changes from server
  useEffect(() => {
    form.reset({
      symbol: config.symbol,
      buyThreshold: config.buyThreshold,
      sellThreshold: config.sellThreshold,
      buyKey: config.buyKey,
      sellKey: config.sellKey,
      isActive: config.isActive,
    });
  }, [config, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await updateConfig.mutateAsync(values);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-secondary/50 border-white/10 hover:bg-secondary hover:text-white">
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Controller Configuration</DialogTitle>
          <DialogDescription>
            Adjust the thresholds and key mappings for the MAME controller triggers.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Trading Pair (Binance)</FormLabel>
                    <FormControl>
                      <Input placeholder="btcusdt" {...field} className="font-mono uppercase" />
                    </FormControl>
                    <FormDescription>The symbol to monitor (e.g., btcusdt, ethusdt).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="col-span-2 grid grid-cols-2 gap-4 p-4 rounded-xl bg-secondary/30 border border-white/5">
                <FormField
                  control={form.control}
                  name="buyThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[hsl(var(--color-buy))]">Buy Threshold</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="buyKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buy Key</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={1} className="font-mono text-center uppercase" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-2 grid grid-cols-2 gap-4 p-4 rounded-xl bg-secondary/30 border border-white/5">
                <FormField
                  control={form.control}
                  name="sellThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[hsl(var(--color-sell))]">Sell Threshold</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sellKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sell Key</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={1} className="font-mono text-center uppercase" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/5 p-4 bg-secondary/30 col-span-2">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">System Active</FormLabel>
                      <FormDescription>
                        Toggle monitoring on/off
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateConfig.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {updateConfig.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {!updateConfig.isPending && <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
