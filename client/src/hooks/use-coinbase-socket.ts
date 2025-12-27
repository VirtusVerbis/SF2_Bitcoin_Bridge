import { useEffect, useRef, useState } from 'react';

type CoinbaseTrade = {
  type: string;
  product_id: string;
  price: string;
  size: string;
  side: string; // 'buy' or 'sell'
  time: string;
};

export type QuantityData = {
  buyQuantity: number;
  sellQuantity: number;
  lastPrice: number;
};

export function useCoinbaseSocket(symbol: string, isEnabled: boolean = true) {
  const [data, setData] = useState<QuantityData>({ buyQuantity: 0, sellQuantity: 0, lastPrice: 0 });
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
    
    const wsUrl = `wss://ws-feed.exchange.coinbase.com`;
    
    try {
      setStatus('connecting');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Subscribe to the product
        ws.send(JSON.stringify({
          type: 'subscribe',
          product_ids: [symbol],
          channels: ['matches']
        }));
        setStatus('connected');
        console.log(`Connected to Coinbase stream for ${symbol}`);
      };

      ws.onmessage = (event) => {
        try {
          const trade: CoinbaseTrade = JSON.parse(event.data);
          
          // Only process match (trade) events
          if (trade.type !== 'match') return;
          
          const price = parseFloat(trade.price);
          const quantity = parseFloat(trade.size);
          
          // 'buy' side means a buy was initiated, 'sell' side means a sell was initiated
          if (trade.side === 'buy') {
            accumulators.current.buy += quantity;
          } else if (trade.side === 'sell') {
            accumulators.current.sell += quantity;
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
        } catch (err) {
          // Ignore non-trade messages (like subscription confirmations)
        }
      };

      ws.onerror = (error) => {
        console.error('Coinbase WebSocket error:', error);
        setStatus('error');
      };

      ws.onclose = () => {
        setStatus('disconnected');
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'unsubscribe',
            product_ids: [symbol],
            channels: ['matches']
          }));
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
