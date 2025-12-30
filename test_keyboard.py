import ctypes
from ctypes import c_uint, c_int, Structure, Union, byref, windll
import time

INPUT_KEYBOARD = 1
KEYEVENTF_KEYUP = 0x0002

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

KEY_CODES = {
    'X': {'vk': 0x58, 'scan': 0x2D},
    'Y': {'vk': 0x59, 'scan': 0x15},
    'A': {'vk': 0x41, 'scan': 0x1E},
    'B': {'vk': 0x42, 'scan': 0x30},
}

def press_key_with_shift(key_char, key_name):
    """Test a single uppercase key press with Shift held"""
    if key_char not in KEY_CODES:
        print(f"Unknown key: {key_char}")
        return
    
    key_info = KEY_CODES[key_char]
    vk = key_info['vk']
    scan = key_info['scan']
    
    print(f"Testing {key_name} ({key_char})... click in Notepad window now")
    time.sleep(1)
    
    # Press and hold Shift (VK_SHIFT = 0x10, scan = 0x2A)
    shift_inp_down = INPUT()
    shift_inp_down.type = INPUT_KEYBOARD
    shift_inp_down.ii.ki.wVk = 0x10
    shift_inp_down.ii.ki.wScan = 0x2A
    shift_inp_down.ii.ki.dwFlags = 0
    shift_inp_down.ii.ki.time = 0
    shift_inp_down.ii.ki.dwExtraInfo = 0
    windll.user32.SendInput(1, byref(shift_inp_down), ctypes.sizeof(INPUT))
    print(f"  Shift down")
    
    time.sleep(0.05)
    
    # Key down
    inp = INPUT()
    inp.type = INPUT_KEYBOARD
    inp.ii.ki.wVk = vk
    inp.ii.ki.wScan = scan
    inp.ii.ki.dwFlags = 0
    inp.ii.ki.time = 0
    inp.ii.ki.dwExtraInfo = 0
    result = windll.user32.SendInput(1, byref(inp), ctypes.sizeof(INPUT))
    print(f"  Key {key_char} down result: {result}")
    
    # Hold key
    time.sleep(0.1)
    
    # Key up
    inp2 = INPUT()
    inp2.type = INPUT_KEYBOARD
    inp2.ii.ki.wVk = vk
    inp2.ii.ki.wScan = scan
    inp2.ii.ki.dwFlags = KEYEVENTF_KEYUP
    inp2.ii.ki.time = 0
    inp2.ii.ki.dwExtraInfo = 0
    result2 = windll.user32.SendInput(1, byref(inp2), ctypes.sizeof(INPUT))
    print(f"  Key {key_char} up result: {result2}")
    
    time.sleep(0.05)
    
    # Release Shift
    shift_inp_up = INPUT()
    shift_inp_up.type = INPUT_KEYBOARD
    shift_inp_up.ii.ki.wVk = 0x10
    shift_inp_up.ii.ki.wScan = 0x2A
    shift_inp_up.ii.ki.dwFlags = KEYEVENTF_KEYUP
    shift_inp_up.ii.ki.time = 0
    shift_inp_up.ii.ki.dwExtraInfo = 0
    windll.user32.SendInput(1, byref(shift_inp_up), ctypes.sizeof(INPUT))
    print(f"  Shift up")
    print()

if __name__ == "__main__":
    print("=== Windows SendInput Keyboard Test (Uppercase with Shift) ===")
    print("Open Notepad and keep focus on it\n")
    
    press_key_with_shift('X', "X (Binance Buy)")
    press_key_with_shift('Y', "Y (Binance Sell)")
    press_key_with_shift('A', "A (Coinbase Buy)")
    press_key_with_shift('B', "B (Coinbase Sell)")
    
    print("Test complete!")
