#!/usr/bin/env python3
"""
Binance Volume to MAME Keyboard Bridge
Connects to Binance WebSocket for real-time volume data and simulates keyboard presses
for MAME arcade controls based on configurable buy/sell thresholds.

Required packages:
  pip install pynput websocket-client requests
"""

import json
import time
import requests
import logging
from datetime import datetime
from pynput.keyboard import Controller, Key
from websocket import WebSocketApp, WebSocketException

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BinanceMAMEBridge:
    def __init__(self, dashboard_url="http://localhost:5000"):
        self.dashboard_url = dashboard_url
        self.keyboard = Controller()
        self.config = None
        self.ws = None
        self.buy_volume = 0
        self.sell_volume = 0
        self.last_buy_press = 0
        self.last_sell_press = 0
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
                logger.info(f"Config loaded: {self.config['symbol'].upper()} | "
                          f"Buy: {self.config['buyThreshold']} ({self.config['buyKey']}) | "
                          f"Sell: {self.config['sellThreshold']} ({self.config['sellKey']})")
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
            self.ws = WebSocketApp(
                ws_url,
                on_message=self.on_ws_message,
                on_error=self.on_ws_error,
                on_close=self.on_ws_close,
                on_open=self.on_ws_open
            )
            self.ws.run_forever(reconnect=5)
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            return False
    
    def on_ws_open(self, ws):
        """Called when WebSocket connection opens"""
        logger.info("Binance WebSocket connected")
    
    def on_ws_message(self, ws, message):
        """Process incoming trade data from Binance"""
        try:
            data = json.loads(message)
            
            # aggTrade fields: p=price, q=quantity, m=isBuyerMaker
            price = float(data.get('p', 0))
            quantity = float(data.get('q', 0))
            is_buyer_maker = data.get('m', False)
            
            # Accumulate volume (reset every ~1 second in practice due to message frequency)
            if is_buyer_maker:
                self.sell_volume += quantity
            else:
                self.buy_volume += quantity
            
            # Check thresholds and press keys
            self.check_and_press(price, quantity)
            
            # Reset volumes periodically (every 100 messages ~1 second)
            if 'E' in data:
                event_time = data['E']
                # You could implement time-based reset here
        
        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON: {message}")
        except Exception as e:
            logger.error(f"Error processing message: {e}")
    
    def on_ws_error(self, ws, error):
        """Handle WebSocket errors"""
        logger.error(f"WebSocket error: {error}")
    
    def on_ws_close(self, ws, close_status_code, close_msg):
        """Called when WebSocket closes"""
        logger.warning(f"WebSocket closed: {close_status_code} - {close_msg}")
        logger.info("Attempting to reconnect in 5 seconds...")
        time.sleep(5)
        self.run()
    
    def check_and_press(self, price, quantity):
        """Check thresholds and simulate key presses"""
        if not self.config:
            return
        
        current_time = time.time()
        
        # Check buy threshold (sell volume)
        if self.sell_volume >= self.config['sellThreshold']:
            if current_time - self.last_sell_press > self.press_cooldown:
                self.press_key(self.config['sellKey'])
                self.last_sell_press = current_time
                self.sell_volume = 0  # Reset after press
        
        # Check sell threshold (buy volume)
        if self.buy_volume >= self.config['buyThreshold']:
            if current_time - self.last_buy_press > self.press_cooldown:
                self.press_key(self.config['buyKey'])
                self.last_buy_press = current_time
                self.buy_volume = 0  # Reset after press
    
    def press_key(self, key_char):
        """Simulate a keyboard key press"""
        try:
            key_char = key_char.lower().strip()
            
            if key_char == 'x':
                logger.info(f"Pressing X (Buy) | Price: BTC volume triggered")
                self.keyboard.press('x')
                time.sleep(0.05)
                self.keyboard.release('x')
            elif key_char == 'y':
                logger.info(f"Pressing Y (Sell) | Price: BTC volume triggered")
                self.keyboard.press('y')
                time.sleep(0.05)
                self.keyboard.release('y')
            else:
                # Support any other key
                logger.info(f"Pressing {key_char.upper()}")
                self.keyboard.press(key_char)
                time.sleep(0.05)
                self.keyboard.release(key_char)
        except Exception as e:
            logger.error(f"Error pressing key '{key_char}': {e}")
    
    def run(self):
        """Main run loop"""
        logger.info("Starting Binance MAME Bridge...")
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
        
        # Connect to Binance WebSocket
        self.connect_binance()


if __name__ == "__main__":
    bridge = BinanceMAMEBridge()
    try:
        bridge.run()
    except KeyboardInterrupt:
        logger.info("Shutting down...")
