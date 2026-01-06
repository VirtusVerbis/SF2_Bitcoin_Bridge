#!/usr/bin/env python3
"""
Crypto Quantity to MAME Keyboard Bridge - SF2 Edition
Supports 12 buttons (6 per player) with range-based triggers.
Now includes 9 Special Moves per player with 3 command formats:
- Rapid repeat: "xxxxx" (same key mashed)
- Sequential: "x,y,c,u" (comma-separated keys)
- Simultaneous: "x+y+c" (keys pressed together)
"""

import json
import time
import requests
import logging
import threading
import random
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
    CHARGE = 5
    HALF_CIRCLE_CHARGE = 6

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
        # Jump/Crouch state tracking - last trigger time for periodic key presses
        self.jump_crouch_last_trigger = {
            'binanceJump': 0,
            'binanceCrouch': 0,
            'coinbaseJump': 0,
            'coinbaseCrouch': 0,
        }
        self.jump_crouch_active = {
            'binanceJump': False,
            'binanceCrouch': False,
            'coinbaseJump': False,
            'coinbaseCrouch': False,
        }

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

    def press_key_hold(self, key_char, duration=0.1):
        try:
            key_char = key_char.lower().strip()
            if key_char not in ALLOWED_KEYS:
                logger.warning(f"Key '{key_char}' not in allowed keys, skipping")
                return
            self.keyboard.press(key_char)
            time.sleep(duration)
            # self.keyboard.release(key_char)  # don't release - hold it
        except Exception as e:
            logger.error(f"Error pressing key '{key_char}': {e}")

    def parse_command(self, command):
        """Parse a command string and return (CommandType, tokens)
        
        Command formats:
        - Rapid repeat: "xxxxx" (same key mashed)
        - Sequential: "x,y,c,u" (comma-separated keys)
        - Simultaneous: "x+y+c" (keys pressed together)
        - Charge: "++f,h,x" (hold first key 2s, then sequential with overlap)
        - Single: "x" (single key press)
        """
        if not command or not command.strip():
            return None, []

        command = command.lower().strip()

        # Check for charge commands (starts with "++")
        # CHARGE: 3 keys (++f,h,x) - hold charge, release to direction, attack
        # HALF_CIRCLE_CHARGE: 4+ keys (++f,g,h,x) - hold charge, roll through directions, attack
        if command.startswith('++'):
            charge_command = command[2:]  # Remove the "++" prefix
            tokens = [t.strip() for t in charge_command.split(',') if t.strip()]
            valid_tokens = [t for t in tokens if len(t) == 1 and t in ALLOWED_KEYS]
            if len(valid_tokens) < 3:
                logger.warning(f"Charge command '{command}' needs at least 3 keys (charge + direction + attack)")
                return None, []
            if len(valid_tokens) != len(tokens):
                logger.warning(f"Some tokens in charge command '{command}' are invalid")
            # 3 keys = CHARGE, 4+ keys = HALF_CIRCLE_CHARGE
            if len(valid_tokens) == 3:
                return CommandType.CHARGE, valid_tokens
            else:
                return CommandType.HALF_CIRCLE_CHARGE, valid_tokens

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
        Last two keys held together and released together for better move registration
        """
        if not tokens:
            return
        logger.info(f"Executing sequential: {tokens}")

        if len(tokens) == 1:
            self.keyboard.press(tokens[0])
            time.sleep(0.067)
            self.keyboard.release(tokens[0])
            return

        for i, key in enumerate(tokens[:-2]):
            self.keyboard.press(key)
            time.sleep(0.033)

            self.keyboard.release(key)

            #time.sleep(0.017)


        third_last = tokens[-3]
        second_last = tokens[-2]
        last = tokens[-1]

        self.keyboard.press(third_last)
        self.keyboard.press(second_last)
        time.sleep(0.033)

        self.keyboard.release(third_last)

        time.sleep(0.017)

        #time.sleep(0.017)

        self.keyboard.press(last)
        #time.sleep(0.067)    
        time.sleep(0.033)   

        self.keyboard.release(second_last)
        self.keyboard.release(last)

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
                #time.sleep(0.03)
            #time.sleep(0.1)
            time.sleep(2)
        finally:
            for key in reversed(pressed_keys):
                self.keyboard.release(key)
                time.sleep(0.03)

    def execute_charge(self, tokens):
        """Execute a charge move (e.g., Guile's Sonic Boom: ++f,h,x)
        
        Charge move timing for SF2:
        - Hold the charge key (first token) for 2 seconds
        - Release charge key while pressing the direction key with rolling overlap
        - Then press the attack key(s)
        
        Example: "++f,h,x" means:
        1. Hold 'f' (back) for 2 seconds
        2. Release 'f' while pressing 'h' (forward) with 50ms overlap
        3. Press 'x' (punch) while 'h' is still held
        4. Release all keys
        """
        if len(tokens) < 2:
            logger.warning(f"Charge command needs at least 2 keys, got: {tokens}")
            return
        
        charge_key = tokens[0]
        direction_key = tokens[1]
        attack_keys = tokens[2:] if len(tokens) > 2 else []
        
        logger.info(f"Executing charge move: charge={charge_key}, direction={direction_key}, attacks={attack_keys}")
        
        try:
            # Step 1: Hold charge key for 2 seconds
            self.keyboard.press(charge_key)
            time.sleep(2.0)
            
            # Step 2: Rolling overlap - press direction while still holding charge
            self.keyboard.press(direction_key)
            time.sleep(0.05)  # 50ms overlap
            
            # Step 3: Release charge key
            self.keyboard.release(charge_key)
            time.sleep(0.033)  # Small gap before attack
            
            # Step 4: Press attack key(s) while holding direction
            for attack_key in attack_keys:
                self.keyboard.press(attack_key)
                time.sleep(0.033)
            
            # Hold the final position briefly
            time.sleep(0.1)
            
            # Step 5: Release all keys (attack keys first, then direction)
            for attack_key in reversed(attack_keys):
                self.keyboard.release(attack_key)
                time.sleep(0.017)
            
            self.keyboard.release(direction_key)
            
        except Exception as e:
            logger.error(f"Error executing charge move: {e}")

    def execute_half_circle_charge(self, tokens):
        """Execute a half-circle charge move (e.g., Dhalsim's Yoga Flame: ++f,g,h,x)
        
        Half-circle charge move timing for SF2:
        - Hold the first key (charge) for 2 seconds
        - Roll through middle direction keys with overlapping releases
        - Keep final direction held while pressing attack
        
        Example: "++f,g,h,x" means:
        1. Hold 'f' (back) for 2 seconds
        2. Press 'g' (down) while releasing 'f' with overlap
        3. Press 'h' (forward) while releasing 'g' with overlap
        4. Press 'x' (punch) while 'h' is still held
        5. Release all keys
        """
        if len(tokens) < 4:
            logger.warning(f"Half-circle charge needs at least 4 keys, got: {tokens}")
            return
        
        charge_key = tokens[0]
        direction_keys = tokens[1:-1]  # All middle keys are directions
        attack_key = tokens[-1]
        
        logger.info(f"Executing half-circle charge: charge={charge_key}, directions={direction_keys}, attack={attack_key}")
        
        try:
            # Step 1: Hold charge key for 2 seconds
            self.keyboard.press(charge_key)
            time.sleep(2.0)
            
            # Step 2: Roll through direction keys with overlapping releases
            prev_key = charge_key
            for direction_key in direction_keys:
                # Press next direction while still holding previous
                self.keyboard.press(direction_key)
                time.sleep(0.05)  # 50ms overlap
                
                # Release previous key
                self.keyboard.release(prev_key)
                time.sleep(0.033)  # Small gap
                
                prev_key = direction_key
            
            # Step 3: Press attack while holding final direction
            self.keyboard.press(attack_key)
            time.sleep(0.1)  # Hold briefly
            
            # Step 4: Release attack first, then final direction
            self.keyboard.release(attack_key)
            time.sleep(0.017)
            self.keyboard.release(prev_key)
            
        except Exception as e:
            logger.error(f"Error executing half-circle charge move: {e}")

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
        elif cmd_type == CommandType.CHARGE:
            self.execute_charge(tokens)
        elif cmd_type == CommandType.HALF_CIRCLE_CHARGE:
            self.execute_half_circle_charge(tokens)

    def check_special_moves(self, quantity, exchange, signal_type):
        """Check if quantity triggers any special moves for the given exchange and signal type (1-9)"""
        if not self.config or not self.config.get('isActive'):
            return

        prefix = 'binance' if exchange == 'binance' else 'coinbase'

        for i in range(1, 10):
            special_signal = self.config.get(f"{prefix}Special{i}Signal", "buy")
            if special_signal != signal_type:
                continue

            min_val = float(self.config.get(f"{prefix}Special{i}Min", 0))
            max_val = float(self.config.get(f"{prefix}Special{i}Max", 0))
            command = self.config.get(f"{prefix}Special{i}Command", "")

            if min_val <= quantity <= max_val and command:
                self.execute_special_command(command, f"{prefix}Special{i}")
                break

    def check_movement_controls(self, quantity, exchange, signal_type):
        """Check if quantity triggers movement controls (Forward/Backward) for the given exchange and signal type"""
        if not self.config or not self.config.get('isActive'):
            return

        prefix = 'binance' if exchange == 'binance' else 'coinbase'

        movements = ['MoveForward', 'MoveBackward']
        for movement in movements:
            movement_signal = self.config.get(f"{prefix}{movement}Signal", "buy")
            if movement_signal != signal_type:
                continue

            min_val = float(self.config.get(f"{prefix}{movement}Min", 0))
            max_val = float(self.config.get(f"{prefix}{movement}Max", 0))
            key = self.config.get(f"{prefix}{movement}Key", "")

            if min_val <= quantity <= max_val and key:
                logger.info(f"MOVing {movement} ({prefix}) with key {key} (Qty: {quantity})")
                self.press_key(key,0.5)

    def execute_directional_jump(self, jump_key, direction_key):
        """Execute a directional jump: press direction, then jump, then release both.
        
        This creates a rolling overlap for diagonal jumps in fighting games.
        """
        try:
            direction_key = direction_key.lower().strip()
            jump_key = jump_key.lower().strip()
            
            if direction_key not in ALLOWED_KEYS or jump_key not in ALLOWED_KEYS:
                logger.warning(f"Invalid keys for directional jump: dir={direction_key}, jump={jump_key}")
                return
            
            # Press direction first
            self.keyboard.press(direction_key)
            time.sleep(0.05)  # Small overlap delay
            
            # Press jump while holding direction
            self.keyboard.press(jump_key)
            time.sleep(0.15)  # Hold both keys
            
            # Release both keys
            self.keyboard.release(jump_key)
            self.keyboard.release(direction_key)
            
        except Exception as e:
            logger.error(f"Error executing directional jump: {e}")

    def check_jump_crouch_controls(self, quantity, exchange, signal_type):
        """Check if quantity triggers jump/crouch controls with periodic key pressing based on delay.

        Jump/Crouch work differently from other controls - they trigger periodic key presses
        based on a configurable delay (in seconds). When quantity is in range, the key will
        be pressed once every 'delay' seconds.
        
        For Jump, randomly selects between:
        - Left + Jump (directional jump left)
        - Right + Jump (directional jump right)
        - Neutral Jump (jump key only)
        """
        if not self.config or not self.config.get('isActive'):
            return

        prefix = 'binance' if exchange == 'binance' else 'coinbase'
        now = time.time()

        actions = ['Jump', 'Crouch']
        for action in actions:
            action_signal = self.config.get(f"{prefix}{action}Signal", "buy")
            if action_signal != signal_type:
                self.jump_crouch_active[f"{prefix}{action}"] = False
                continue

            min_val = float(self.config.get(f"{prefix}{action}Min", 0))
            max_val = float(self.config.get(f"{prefix}{action}Max", 0))
            key = self.config.get(f"{prefix}{action}Key", "")
            delay = float(self.config.get(f"{prefix}{action}Delay", 5.0))

            if min_val <= quantity <= max_val and key:
                action_key = f"{prefix}{action}"
                self.jump_crouch_active[action_key] = True

                # Check if enough time has passed since last trigger
                last_trigger = self.jump_crouch_last_trigger.get(action_key, 0)
                if now - last_trigger >= delay:
                    if action == 'Jump':
                        # Get directional keys for Jump
                        left_key = self.config.get(f"{prefix}JumpLeftKey", "")
                        right_key = self.config.get(f"{prefix}JumpRightKey", "")
                        
                        # Build list of available jump options
                        jump_options = ['neutral']  # Always have neutral jump
                        if left_key and left_key.strip():
                            jump_options.append('left')
                        if right_key and right_key.strip():
                            jump_options.append('right')
                        
                        # Randomly select jump type
                        jump_type = random.choice(jump_options)
                        
                        if jump_type == 'left':
                            logger.info(f"Triggering Left Jump ({prefix}) with keys {left_key}+{key} (Qty: {quantity}, Delay: {delay}s)")
                            self.execute_directional_jump(key, left_key)
                        elif jump_type == 'right':
                            logger.info(f"Triggering Right Jump ({prefix}) with keys {right_key}+{key} (Qty: {quantity}, Delay: {delay}s)")
                            self.execute_directional_jump(key, right_key)
                        else:
                            logger.info(f"Triggering Neutral Jump ({prefix}) with key {key} (Qty: {quantity}, Delay: {delay}s)")
                            self.press_key(key, 0.15)
                    else:
                        # Crouch behavior unchanged
                        logger.info(f"Triggering {action} ({prefix}) with key {key} (Qty: {quantity}, Delay: {delay}s)")
                        self.press_key_hold(key, 1.75)

                    self.jump_crouch_last_trigger[action_key] = now
            else:
                self.jump_crouch_active[f"{prefix}{action}"] = False

    def on_binance_message(self, ws, message):
        try:
            data = json.loads(message)
            quantity = float(data.get('q', 0))
            is_buyer_maker = data.get('m', False)

            # Binance Buy = Punches, Sell = Kicks
            if not is_buyer_maker: # Buy
                self.check_range_and_press(quantity, 'binanceBuy')
                self.check_special_moves(quantity, 'binance', 'buy')
                self.check_movement_controls(quantity, 'binance', 'buy')
                self.check_jump_crouch_controls(quantity, 'binance', 'buy')
            else: # Sell
                self.check_range_and_press(quantity, 'binanceSell')
                self.check_special_moves(quantity, 'binance', 'sell')
                self.check_movement_controls(quantity, 'binance', 'sell')
                self.check_jump_crouch_controls(quantity, 'binance', 'sell')
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
                self.check_movement_controls(quantity, 'coinbase', 'buy')
                self.check_jump_crouch_controls(quantity, 'coinbase', 'buy')
            elif side == 'sell':
                self.check_range_and_press(quantity, 'coinbaseSell')
                self.check_special_moves(quantity, 'coinbase', 'sell')
                self.check_movement_controls(quantity, 'coinbase', 'sell')
                self.check_jump_crouch_controls(quantity, 'coinbase', 'sell')
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
