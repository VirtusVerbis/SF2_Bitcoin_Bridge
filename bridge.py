#!/usr/bin/env python3
"""
Crypto Quantity to MAME Keyboard Bridge
Connects to Binance and Coinbase WebSockets for real-time quantity data and simulates keyboard presses
for MAME arcade controls based on configurable buy/sell thresholds.

Required packages:
  pip install pynput websocket-client requests
"""

import json
import time
import requests
import logging
import threading
from datetime import datetime
from pynput.keyboard import Controller, Key
from websocket import WebSocketApp, WebSocketException

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
        self.binance_buy_quantity = 0
        self.binance_sell_quantity = 0
        self.coinbase_buy_quantity = 0
        self.coinbase_sell_quantity = 0
        self.last_binance_buy_press = 0
        self.last_binance_sell_press = 0
        self.last_coinbase_buy_press = 0
        self.last_coinbase_sell_press = 0
        self.press_cooldown = 0.5  # Prevent rapid repeated presses
        
    def fetch_config(self):
        """Fetch configuration from dashboard API"""
        try:
            response = requests.get(
                f"{self.dashboard_url}/api/configurations",
                timeout=5
            )
            if response.status_code == 200:
                self.config = response.json()
                logger.info(f"Binance: {self.config['symbol'].upper()} | "
                          f"Buy: {self.config['buyThreshold']} ({self.config['buyKey']}) | "
                          f"Sell: {self.config['sellThreshold']} ({self.config['sellKey']})")
                logger.info(f"Coinbase: {self.config['coinbaseSymbol']} | "
                          f"Buy: {self.config['coinbaseBuyThreshold']} ({self.config['coinbaseBuyKey']}) | "
                          f"Sell: {self.config['coinbaseSellThreshold']} ({self.config['coinbaseSellKey']})")
                return True
            else:
                logger.error(f"Failed to fetch config: HTTP {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"Error fetching config: {e}")
            return False
    
    def connect_binance(self):
        """Connect to Binance WebSocket stream"""
        if not self.config:
            logger.error("No configuration available")
            return False
        
        symbol = self.config['symbol'].lower()
        ws_url = f"wss://stream.binance.com:9443/ws/{symbol}@aggTrade"
        
        logger.info(f"Connecting to Binance: {ws_url}")
        
        try:
            self.binance_ws = WebSocketApp(
                ws_url,
                on_message=self.on_binance_message,
                on_error=self.on_binance_error,
                on_close=self.on_binance_close,
                on_open=self.on_binance_open
            )
            self.binance_ws.run_forever(reconnect=5)
        except Exception as e:
            logger.error(f"Binance WebSocket error: {e}")
            return False
    
    def connect_coinbase(self):
        """Connect to Coinbase WebSocket stream"""
        if not self.config:
            logger.error("No configuration available")
            return False
        
        ws_url = "wss://ws-feed.exchange.coinbase.com"
        
        logger.info(f"Connecting to Coinbase: {ws_url}")
        
        try:
            self.coinbase_ws = WebSocketApp(
                ws_url,
                on_message=self.on_coinbase_message,
                on_error=self.on_coinbase_error,
                on_close=self.on_coinbase_close,
                on_open=self.on_coinbase_open
            )
            self.coinbase_ws.run_forever(reconnect=5)
        except Exception as e:
            logger.error(f"Coinbase WebSocket error: {e}")
            return False
    
    def on_binance_open(self, ws):
        """Called when Binance WebSocket connection opens"""
        logger.info("Binance WebSocket connected")
    
    def on_binance_message(self, ws, message):
        """Process incoming trade data from Binance"""
        try:
            data = json.loads(message)
            
            # aggTrade fields: p=price, q=quantity, m=isBuyerMaker
            quantity = float(data.get('q', 0))
            is_buyer_maker = data.get('m', False)
            
            # Accumulate quantity
            if is_buyer_maker:
                self.binance_sell_quantity += quantity
            else:
                self.binance_buy_quantity += quantity
            
            # Check thresholds and press keys
            self.check_and_press_binance()
        
        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON: {message}")
        except Exception as e:
            logger.error(f"Error processing Binance message: {e}")
    
    def on_binance_error(self, ws, error):
        """Handle Binance WebSocket errors"""
        logger.error(f"Binance WebSocket error: {error}")
    
    def on_binance_close(self, ws, close_status_code, close_msg):
        """Called when Binance WebSocket closes"""
        logger.warning(f"Binance WebSocket closed: {close_status_code} - {close_msg}")
    
    def on_coinbase_open(self, ws):
        """Called when Coinbase WebSocket connection opens"""
        logger.info("Coinbase WebSocket connected, subscribing to matches")
        subscribe_msg = {
            "type": "subscribe",
            "product_ids": [self.config['coinbaseSymbol']],
            "channels": ["matches"]
        }
        ws.send(json.dumps(subscribe_msg))
    
    def on_coinbase_message(self, ws, message):
        """Process incoming trade data from Coinbase"""
        try:
            data = json.loads(message)
            
            # Only process match (trade) events
            if data.get('type') != 'match':
                return
            
            quantity = float(data.get('size', 0))
            side = data.get('side', '')
            
            # Accumulate quantity based on side
            if side == 'buy':
                self.coinbase_buy_quantity += quantity
            elif side == 'sell':
                self.coinbase_sell_quantity += quantity
            
            # Check thresholds and press keys
            self.check_and_press_coinbase()
        
        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON: {message}")
        except Exception as e:
            logger.error(f"Error processing Coinbase message: {e}")
    
    def on_coinbase_error(self, ws, error):
        """Handle Coinbase WebSocket errors"""
        logger.error(f"Coinbase WebSocket error: {error}")
    
    def on_coinbase_close(self, ws, close_status_code, close_msg):
        """Called when Coinbase WebSocket closes"""
        logger.warning(f"Coinbase WebSocket closed: {close_status_code} - {close_msg}")
    
    def check_and_press_binance(self):
        """Check Binance thresholds and simulate key presses"""
        if not self.config:
            return
        
        current_time = time.time()
        buy_threshold = float(self.config['buyThreshold'])
        sell_threshold = float(self.config['sellThreshold'])
        
        # Check buy threshold
        if self.binance_buy_quantity >= buy_threshold:
            if current_time - self.last_binance_buy_press > self.press_cooldown:
                self.press_key(self.config['buyKey'], f"Binance Buy")
                self.last_binance_buy_press = current_time
                self.binance_buy_quantity = 0
        
        # Check sell threshold
        if self.binance_sell_quantity >= sell_threshold:
            if current_time - self.last_binance_sell_press > self.press_cooldown:
                self.press_key(self.config['sellKey'], f"Binance Sell")
                self.last_binance_sell_press = current_time
                self.binance_sell_quantity = 0
    
    def check_and_press_coinbase(self):
        """Check Coinbase thresholds and simulate key presses"""
        if not self.config:
            return
        
        current_time = time.time()
        buy_threshold = float(self.config['coinbaseBuyThreshold'])
        sell_threshold = float(self.config['coinbaseSellThreshold'])
        
        # Check buy threshold
        if self.coinbase_buy_quantity >= buy_threshold:
            if current_time - self.last_coinbase_buy_press > self.press_cooldown:
                self.press_key(self.config['coinbaseBuyKey'], f"Coinbase Buy")
                self.last_coinbase_buy_press = current_time
                self.coinbase_buy_quantity = 0
        
        # Check sell threshold
        if self.coinbase_sell_quantity >= sell_threshold:
            if current_time - self.last_coinbase_sell_press > self.press_cooldown:
                self.press_key(self.config['coinbaseSellKey'], f"Coinbase Sell")
                self.last_coinbase_sell_press = current_time
                self.coinbase_sell_quantity = 0
    
    def press_key(self, key_char, source=""):
        """Simulate a keyboard key press"""
        try:
            key_char = key_char.lower().strip()
            logger.info(f"[{source}] Pressing {key_char.upper()}")
            self.keyboard.press(key_char)
            time.sleep(0.05)
            self.keyboard.release(key_char)
        except Exception as e:
            logger.error(f"Error pressing key '{key_char}': {e}")
    
    def run(self):
        """Main run loop"""
        logger.info("Starting Crypto MAME Bridge...")
        logger.info(f"Dashboard URL: {self.dashboard_url}")
        
        # Fetch initial config
        max_retries = 5
        retry_count = 0
        
        while not self.fetch_config() and retry_count < max_retries:
            retry_count += 1
            logger.warning(f"Retrying config fetch ({retry_count}/{max_retries})...")
            time.sleep(2)
        
        if not self.config:
            logger.error("Failed to fetch configuration. Exiting.")
            return
        
        # Connect to both Binance and Coinbase WebSockets in separate threads
        binance_thread = threading.Thread(target=self.connect_binance, daemon=True)
        coinbase_thread = threading.Thread(target=self.connect_coinbase, daemon=True)
        
        binance_thread.start()
        coinbase_thread.start()
        
        # Keep the main thread alive
        binance_thread.join()
        coinbase_thread.join()


if __name__ == "__main__":
    bridge = CryptoMAMEBridge()
    try:
        bridge.run()
    except KeyboardInterrupt:
        logger.info("Shutting down...")
