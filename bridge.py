#!/usr/bin/env python3
"""
Crypto Quantity to MAME Keyboard Bridge - SF2 Edition
Supports 12 buttons (6 per player) with range-based triggers.
"""

import json
import time
import requests
import logging
import threading
from pynput.keyboard import Controller

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CryptoMAMEBridge:
    def __init__(self, dashboard_url="http://localhost:5000"):
        self.dashboard_url = dashboard_url
        self.keyboard = Controller()
        self.config = None
        self.binance_ws = None
        self.coinbase_ws = None
        self.press_cooldown = 0.2

    def fetch_config(self):
        try:
            response = requests.get(f"{self.dashboard_url}/api/configurations", timeout=5)
            if response.status_code == 200:
                self.config = response.json()
                return True
        except Exception as e:
            logger.error(f"Error fetching config: {e}")
        return False

    def check_range_and_press(self, quantity, config_prefix):
        if not self.config or not self.config.get('isActive'):
            return

        levels = ['Weak', 'Med', 'Strong']
        for level in levels:
            min_val = float(self.config.get(f"{config_prefix}{level}Min", 0))
            max_val = float(self.config.get(f"{config_prefix}{level}Max", 0))
            key = self.config.get(f"{config_prefix}{level}Key")

            if min_val <= quantity <= max_val:
                logger.info(f"Triggering {level} ({config_prefix}) with key {key} (Qty: {quantity})")
                self.press_key(key)
                break

    def press_key(self, key_char):
        try:
            key_char = key_char.lower().strip()
            self.keyboard.press(key_char)
            time.sleep(0.1)
            self.keyboard.release(key_char)
        except Exception as e:
            logger.error(f"Error pressing key '{key_char}': {e}")

    def on_binance_message(self, ws, message):
        try:
            data = json.loads(message)
            quantity = float(data.get('q', 0))
            is_buyer_maker = data.get('m', False)
            
            # Binance Buy = Punches, Sell = Kicks
            if not is_buyer_maker: # Buy
                self.check_range_and_press(quantity, 'binanceBuy')
            else: # Sell
                self.check_range_and_press(quantity, 'binanceSell')
        except Exception as e:
            logger.error(f"Binance error: {e}")

    def on_coinbase_message(self, ws, message):
        try:
            data = json.loads(message)
            if data.get('type') != 'match':
                return
            quantity = float(data.get('size', 0))
            side = data.get('side', '')
            
            # Coinbase Buy = Punches, Sell = Kicks
            if side == 'buy':
                self.check_range_and_press(quantity, 'coinbaseBuy')
            elif side == 'sell':
                self.check_range_and_press(quantity, 'coinbaseSell')
        except Exception as e:
            logger.error(f"Coinbase error: {e}")

    # WebSocket setup methods omitted for brevity, logic remains same as original
    # but uses the new check_range_and_press method in on_message handlers
    
    def connect_binance(self):
        from websocket import WebSocketApp
        symbol = self.config['symbol'].lower()
        ws_url = f"wss://stream.binance.com:9443/ws/{symbol}@aggTrade"
        ws = WebSocketApp(ws_url, on_message=self.on_binance_message)
        ws.run_forever(reconnect=5)

    def connect_coinbase(self):
        from websocket import WebSocketApp
        ws_url = "wss://ws-feed.exchange.coinbase.com"
        def on_open(ws):
            ws.send(json.dumps({
                "type": "subscribe",
                "product_ids": [self.config['coinbaseSymbol']],
                "channels": ["matches"]
            }))
        ws = WebSocketApp(ws_url, on_open=on_open, on_message=self.on_coinbase_message)
        ws.run_forever(reconnect=5)

    def run(self):
        if not self.fetch_config(): return
        threading.Thread(target=self.connect_binance, daemon=True).start()
        threading.Thread(target=self.connect_coinbase, daemon=True).start()
        while True: time.sleep(1)

if __name__ == "__main__":
    import os
    # Update this with your actual dashboard URL if running remotely
    bridge = CryptoMAMEBridge()
    bridge.run()
