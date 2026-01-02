#!/usr/bin/env python3
"""
Crypto Quantity to MAME Keyboard Bridge - SF2 Edition
Supports 12 buttons (6 per player) with range-based triggers.
Now includes Special Move support with 3 command formats:
- Rapid repeat: "xxxxx" (same key mashed)
- Sequential: "x,y,c,u" (comma-separated keys)
- Simultaneous: "x+y+c" (keys pressed together)
"""

import json
import time
import requests
import logging
import threading
from enum import Enum
from pynput.keyboard import Controller

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CommandType(Enum):
    RAPID_REPEAT = 1
    SEQUENTIAL = 2
    SIMULTANEOUS = 3
    SINGLE = 4

ALLOWED_KEYS = set('abcdefghijklmnopqrstuvwxyz0123456789')

class CryptoMAMEBridge:
    def __init__(self, dashboard_url="http://localhost:5000"):
        self.dashboard_url = dashboard_url
        self.keyboard = Controller()
        self.config = None
        self.binance_ws = None
        self.coinbase_ws = None
        self.press_cooldown = 0.2
        self.special_cooldowns = {}
        self.special_cooldown_time = 0.5

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

    def press_key(self, key_char, duration=0.1):
        try:
            key_char = key_char.lower().strip()
            if key_char not in ALLOWED_KEYS:
                logger.warning(f"Key '{key_char}' not in allowed keys, skipping")
                return
            self.keyboard.press(key_char)
            time.sleep(duration)
            self.keyboard.release(key_char)
        except Exception as e:
            logger.error(f"Error pressing key '{key_char}': {e}")

    def parse_command(self, command):
        """Parse a command string and return (CommandType, tokens)"""
        if not command or not command.strip():
            return None, []
        
        command = command.lower().strip()
        
        if '+' in command:
            tokens = [t.strip() for t in command.split('+') if t.strip()]
            valid_tokens = [t for t in tokens if len(t) == 1 and t in ALLOWED_KEYS]
            if len(valid_tokens) != len(tokens):
                logger.warning(f"Some tokens in simultaneous command '{command}' are invalid")
            return CommandType.SIMULTANEOUS, valid_tokens
        
        if ',' in command:
            tokens = [t.strip() for t in command.split(',') if t.strip()]
            valid_tokens = [t for t in tokens if len(t) == 1 and t in ALLOWED_KEYS]
            if len(valid_tokens) != len(tokens):
                logger.warning(f"Some tokens in sequential command '{command}' are invalid")
            return CommandType.SEQUENTIAL, valid_tokens
        
        if len(command) > 1 and len(set(command)) == 1 and command[0] in ALLOWED_KEYS:
            return CommandType.RAPID_REPEAT, [command[0]] * len(command)
        
        if len(command) == 1 and command in ALLOWED_KEYS:
            return CommandType.SINGLE, [command]
        
        logger.warning(f"Unable to parse command: '{command}'")
        return None, []

    def execute_rapid_repeat(self, tokens):
        """Execute rapid key mashing - same key pressed multiple times quickly
        SF2 timing: 33ms press + 17ms gap = 50ms per input (3 frames at 60fps)
        """
        if not tokens:
            return
        key = tokens[0]
        count = len(tokens)
        logger.info(f"Executing rapid repeat: key '{key}' x{count}")
        for _ in range(count):
            self.keyboard.press(key)
            time.sleep(0.033)
            self.keyboard.release(key)
            time.sleep(0.017)

    def execute_sequential(self, tokens):
        """Execute sequential key presses for special move inputs
        SF2 timing: 16ms press + 10ms gap = ~26ms per input (~1.5 frames at 60fps)
        A 3-input motion (e.g. d,df,f for hadouken) completes in ~78ms (5 frames)
        Well within the 10-12 frame window required for special move registration
        Final key held longer (67ms = 4 frames) to ensure move registration
        """
        if not tokens:
            return
        logger.info(f"Executing sequential: {tokens}")
        for i, key in enumerate(tokens):
            is_last_key = (i == len(tokens) - 1)
            self.keyboard.press(key)
            if is_last_key:
                time.sleep(0.067)
            else:
                time.sleep(0.016)
            self.keyboard.release(key)
            if not is_last_key:
                time.sleep(0.010)

    def execute_simultaneous(self, tokens):
        """Execute simultaneous key press (chord)
        SF2 timing: 30ms stagger between presses, 100ms hold, then release
        This ensures all keys register as pressed together for chord inputs
        """
        if not tokens:
            return
        logger.info(f"Executing simultaneous: {tokens}")
        pressed_keys = []
        try:
            for key in tokens:
                self.keyboard.press(key)
                pressed_keys.append(key)
                time.sleep(0.03)
            time.sleep(0.1)
        finally:
            for key in reversed(pressed_keys):
                self.keyboard.release(key)
                time.sleep(0.03)

    def execute_special_command(self, command, special_name):
        """Parse and execute a special move command with cooldown protection"""
        now = time.time()
        if special_name in self.special_cooldowns:
            if now - self.special_cooldowns[special_name] < self.special_cooldown_time:
                return
        
        self.special_cooldowns[special_name] = now
        
        cmd_type, tokens = self.parse_command(command)
        if cmd_type is None or not tokens:
            logger.warning(f"Invalid special command for {special_name}: '{command}'")
            return
        
        logger.info(f"Triggering special move {special_name}: {command}")
        
        if cmd_type == CommandType.RAPID_REPEAT:
            self.execute_rapid_repeat(tokens)
        elif cmd_type == CommandType.SEQUENTIAL:
            self.execute_sequential(tokens)
        elif cmd_type == CommandType.SIMULTANEOUS:
            self.execute_simultaneous(tokens)
        elif cmd_type == CommandType.SINGLE:
            self.press_key(tokens[0])

    def check_special_moves(self, quantity, exchange, signal_type):
        """Check if quantity triggers any special moves for the given exchange and signal type"""
        if not self.config or not self.config.get('isActive'):
            return
        
        prefix = 'binance' if exchange == 'binance' else 'coinbase'
        
        for i in range(1, 4):
            special_signal = self.config.get(f"{prefix}Special{i}Signal", "buy")
            if special_signal != signal_type:
                continue
            
            min_val = float(self.config.get(f"{prefix}Special{i}Min", 0))
            max_val = float(self.config.get(f"{prefix}Special{i}Max", 0))
            command = self.config.get(f"{prefix}Special{i}Command", "")
            
            if min_val <= quantity <= max_val and command:
                self.execute_special_command(command, f"{prefix}Special{i}")
                break

    def on_binance_message(self, ws, message):
        try:
            data = json.loads(message)
            quantity = float(data.get('q', 0))
            is_buyer_maker = data.get('m', False)
            
            # Binance Buy = Punches, Sell = Kicks
            if not is_buyer_maker: # Buy
                self.check_range_and_press(quantity, 'binanceBuy')
                self.check_special_moves(quantity, 'binance', 'buy')
            else: # Sell
                self.check_range_and_press(quantity, 'binanceSell')
                self.check_special_moves(quantity, 'binance', 'sell')
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
                self.check_special_moves(quantity, 'coinbase', 'buy')
            elif side == 'sell':
                self.check_range_and_press(quantity, 'coinbaseSell')
                self.check_special_moves(quantity, 'coinbase', 'sell')
        except Exception as e:
            logger.error(f"Coinbase error: {e}")

    # WebSocket setup methods omitted for brevity, logic remains same as original
    # but uses the new check_range_and_press method in on_message handlers
    
    def connect_binance(self):
        from websocket import WebSocketApp
        symbol = self.config['symbol'].lower()
        ws_url = f"wss://data-stream.binance.vision/ws/{symbol}@aggTrade"
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
