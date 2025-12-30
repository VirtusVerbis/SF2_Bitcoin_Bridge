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
    'x': {'vk': 0x58, 'scan': 0x2D},
    'y': {'vk': 0x59, 'scan': 0x15},
    'a': {'vk': 0x41, 'scan': 0x1E},
    'b': {'vk': 0x42, 'scan': 0x30},
}

def test_key(key_char, key_name):
    """Test a single key press with scan codes"""
    key_info = KEY_CODES[key_char]
    vk = key_info['vk']
    scan = key_info['scan']
    
    print(f"Testing {key_name} (VK={hex(vk)}, Scan={hex(scan)})... click in Notepad window now")
    time.sleep(1)
    
    # Key down
    inp = INPUT()
    inp.type = INPUT_KEYBOARD
    inp.ii.ki.wVk = vk
    inp.ii.ki.wScan = scan
    inp.ii.ki.dwFlags = 0
    inp.ii.ki.time = 0
    inp.ii.ki.dwExtraInfo = 0
    result = windll.user32.SendInput(1, byref(inp), ctypes.sizeof(INPUT))
    print(f"  Key down result: {result}")
    
    # Hold key longer (for DirectInput compatibility)
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
    print(f"  Key up result: {result2}")
    print()

if __name__ == "__main__":
    print("=== Windows SendInput Keyboard Test (with Scan Codes) ===")
    print("Open Notepad and keep focus on it\n")
    
    test_key('x', "X (Binance Buy)")
    test_key('y', "Y (Binance Sell)")
    test_key('a', "A (Coinbase Buy)")
    test_key('b', "B (Coinbase Sell)")
    
    print("Test complete!")
