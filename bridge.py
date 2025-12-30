#!/usr/bin/env python3
"""
Crypto Quantity to MAME Keyboard Bridge
Connects to Binance and Coinbase WebSockets for real-time quantity data and simulates keyboard presses
for MAME arcade controls based on configurable buy/sell thresholds.

Uses Windows SendInput API for direct HID keyboard input compatible with MAME.

Required packages:
  pip install websocket-client requests
"""

import json
import time
import requests
import logging
import threading
import ctypes
from ctypes import c_uint, c_uint64, c_int, c_char, Structure, Union, POINTER, byref, windll
from datetime import datetime
from websocket import WebSocketApp, WebSocketException

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Windows SendInput API structures and constants
INPUT_KEYBOARD = 1
KEYEVENTF_KEYUP = 0x0002
KEYEVENTF_SCANCODE = 0x0008

# Virtual key codes and scan codes for letter keys
# Scan codes are needed for MAME's DirectInput mode (in-game)
KEY_CODES = {
    'a': {'vk': 0x41, 'scan': 0x1E},
    'b': {'vk': 0x42, 'scan': 0x30},
    'c': {'vk': 0x43, 'scan': 0x2E},
    'd': {'vk': 0x44, 'scan': 0x20},
    'e': {'vk': 0x45, 'scan': 0x12},
    'f': {'vk': 0x46, 'scan': 0x21},
    'g': {'vk': 0x47, 'scan': 0x22},
    'h': {'vk': 0x48, 'scan': 0x23},
    'i': {'vk': 0x49, 'scan': 0x17},
    'j': {'vk': 0x4A, 'scan': 0x24},
    'k': {'vk': 0x4B, 'scan': 0x25},
    'l': {'vk': 0x4C, 'scan': 0x26},
    'm': {'vk': 0x4D, 'scan': 0x32},
    'n': {'vk': 0x4E, 'scan': 0x31},
    'o': {'vk': 0x4F, 'scan': 0x18},
    'p': {'vk': 0x50, 'scan': 0x19},
    'q': {'vk': 0x51, 'scan': 0x10},
    'r': {'vk': 0x52, 'scan': 0x13},
    's': {'vk': 0x53, 'scan': 0x1F},
    't': {'vk': 0x54, 'scan': 0x14},
    'u': {'vk': 0x55, 'scan': 0x16},
    'v': {'vk': 0x56, 'scan': 0x2F},
    'w': {'vk': 0x57, 'scan': 0x11},
    'x': {'vk': 0x58, 'scan': 0x2D},
    'y': {'vk': 0x59, 'scan': 0x15},
    'z': {'vk': 0x5A, 'scan': 0x2C},
    '0': {'vk': 0x30, 'scan': 0x0B},
    '1': {'vk': 0x31, 'scan': 0x02},
    '2': {'vk': 0x32, 'scan': 0x03},
    '3': {'vk': 0x33, 'scan': 0x04},
    '4': {'vk': 0x34, 'scan': 0x05},
    '5': {'vk': 0x35, 'scan': 0x06},
    '6': {'vk': 0x36, 'scan': 0x07},
    '7': {'vk': 0x37, 'scan': 0x08},
    '8': {'vk': 0x38, 'scan': 0x09},
    '9': {'vk': 0x39, 'scan': 0x0A},
    'space': {'vk': 0x20, 'scan': 0x39},
    'enter': {'vk': 0x0D, 'scan': 0x1C},
    'escape': {'vk': 0x1B, 'scan': 0x01},
    'tab': {'vk': 0x09, 'scan': 0x0F},
}

class KEYBDINPUT(Structure):
    _fields_ = [
        ("wVk", c_uint),
        ("wScan", c_uint),
        ("dwFlags", c_uint),
        ("time", c_uint),
        ("dwExtraInfo", ctypes.c_void_p)
    ]

class MOUSEINPUT(Structure):
    _fields_ = [
        ("dx", c_int),
        ("dy", c_int),
        ("mouseData", c_uint),
        ("dwFlags", c_uint),
        ("time", c_uint),
        ("dwExtraInfo", ctypes.c_void_p)
    ]

class HARDWAREINPUT(Structure):
    _fields_ = [
        ("uMsg", c_uint),
        ("wParamL", c_uint),
        ("wParamH", c_uint)
    ]

class INPUT_UNION(Union):
    _fields_ = [
        ("mi", MOUSEINPUT),
        ("ki", KEYBDINPUT),
        ("hi", HARDWAREINPUT)
    ]

class INPUT(Structure):
    _fields_ = [
        ("type", c_uint),
        ("ii", INPUT_UNION)
    ]

class CryptoMAMEBridge:
    def __init__(self, dashboard_url="http://localhost:5000"):
        self.dashboard_url = dashboard_url
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
        """Simulate a keyboard key press using Windows SendInput API (DirectInput compatible for MAME)"""
        try:
            key_char = key_char.lower().strip()
            
            # Get virtual key and scan codes
            key_info = KEY_CODES.get(key_char)
            if not key_info:
                logger.error(f"Unknown key: {key_char}")
                return
            
            vk = key_info['vk']
            scan = key_info['scan']
            
            logger.info(f"[{source}] Pressing {key_char.upper()} (VK={hex(vk)}, Scan={hex(scan)})")
            
            # Create key down input with both virtual key and scan code
            inp_down = INPUT()
            inp_down.type = INPUT_KEYBOARD
            inp_down.ii.ki.wVk = vk
            inp_down.ii.ki.wScan = scan
            inp_down.ii.ki.dwFlags = 0
            inp_down.ii.ki.time = 0
            inp_down.ii.ki.dwExtraInfo = 0
            
            # Send key down
            result_down = windll.user32.SendInput(1, byref(inp_down), ctypes.sizeof(INPUT))
            if result_down != 1:
                logger.warning(f"SendInput key down failed (returned {result_down})")
            
            # Hold key longer for MAME's DirectInput (100ms minimum)
            time.sleep(0.1)
            
            # Create key up input with both virtual key and scan code
            inp_up = INPUT()
            inp_up.type = INPUT_KEYBOARD
            inp_up.ii.ki.wVk = vk
            inp_up.ii.ki.wScan = scan
            inp_up.ii.ki.dwFlags = KEYEVENTF_KEYUP
            inp_up.ii.ki.time = 0
            inp_up.ii.ki.dwExtraInfo = 0
            
            # Send key up
            result_up = windll.user32.SendInput(1, byref(inp_up), ctypes.sizeof(INPUT))
            if result_up != 1:
                logger.warning(f"SendInput key up failed (returned {result_up})")
            
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
