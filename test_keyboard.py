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

def test_key(vk, key_name):
    """Test a single key press"""
    print(f"Testing {key_name} (VK={vk})... click in Notepad window now")
    time.sleep(1)
    
    # Key down
    inp = INPUT()
    inp.type = INPUT_KEYBOARD
    inp.ii.ki.wVk = vk
    inp.ii.ki.dwFlags = 0
    result = windll.user32.SendInput(1, byref(inp), ctypes.sizeof(INPUT))
    print(f"  Key down result: {result}")
    
    time.sleep(0.05)
    
    # Key up
    inp2 = INPUT()
    inp2.type = INPUT_KEYBOARD
    inp2.ii.ki.wVk = vk
    inp2.ii.ki.dwFlags = KEYEVENTF_KEYUP
    result2 = windll.user32.SendInput(1, byref(inp2), ctypes.sizeof(INPUT))
    print(f"  Key up result: {result2}")
    print()

if __name__ == "__main__":
    print("=== Windows SendInput Keyboard Test ===")
    print("Open Notepad and keep focus on it\n")
    
    test_key(0x58, "X")  # X key
    test_key(0x41, "A")  # A key
    test_key(0x59, "Y")  # Y key
    test_key(0x42, "B")  # B key
    
    print("Test complete!")
