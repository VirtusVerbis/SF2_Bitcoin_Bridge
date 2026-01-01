import { useEffect, useRef, useState } from 'react';

type Trade = {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  a: number; // Aggregate trade ID
  p: string; // Price
  q: string; // Quantity
  f: number; // First trade ID
  l: number; // Last trade ID
  T: number; // Trade time
  m: boolean; // Is the buyer the market maker? (true = Sell, false = Buy)
  M: boolean; // Ignore
};

export type VolumeData = {
  buyQuantity: number;
  sellQuantity: number;
  lastPrice: number;
};

export function useBinanceSocket(symbol: string, isEnabled: boolean = true) {
  const [data, setData] = useState<VolumeData>({ buyQuantity: 0, sellQuantity: 0, lastPrice: 0 });
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  
  // Accumulators for the rolling window
  const accumulators = useRef({ buy: 0, sell: 0 });
  const lastReset = useRef(Date.now());

  useEffect(() => {
    if (!isEnabled || !symbol) return;

    // Reset state on symbol change
    setData({ buyQuantity: 0, sellQuantity: 0, lastPrice: 0 });
    accumulators.current = { buy: 0, sell: 0 };
    
    const wsUrl = `wss://data-stream.binance.vision/ws/${symbol.toLowerCase()}@aggTrade`;
    
    try {
      setStatus('connecting');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        console.log(`Connected to Binance stream for ${symbol}`);
      };

      ws.onmessage = (event) => {
        const trade: Trade = JSON.parse(event.data);
        const price = parseFloat(trade.p);
        const quantity = parseFloat(trade.q);
        const isSell = trade.m; // m=true means buyer is maker, so it's a SELL order hitting the bid

        if (isSell) {
          accumulators.current.sell += quantity;
        } else {
          accumulators.current.buy += quantity;
        }

        // Reset accumulators every 500ms for "instant" velocity feeling
        const now = Date.now();
        if (now - lastReset.current > 500) {
          setData({
            buyQuantity: accumulators.current.buy,
            sellQuantity: accumulators.current.sell,
            lastPrice: price
          });
          accumulators.current = { buy: 0, sell: 0 };
          lastReset.current = now;
        } else {
            // Update price immediately even if quantity hasn't reset
             setData(prev => ({
                ...prev,
                lastPrice: price
            }));
        }
      };

      ws.onerror = (error) => {
        console.error('Binance WebSocket error:', error);
        setStatus('error');
      };

      ws.onclose = () => {
        setStatus('disconnected');
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setStatus('error');
    }
  }, [symbol, isEnabled]);

  return { data, status };
}
