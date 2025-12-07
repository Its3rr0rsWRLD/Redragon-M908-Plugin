# Redragon M908 Mouse (SignalRGB Plugin)

Basic SignalRGB plugin for the Redragon M908. One LED, custom HID packets, no bullshit.

## Setup
1. Put `RedragonMouse.js` and `RedragonMouse.png` in the same folder
2. PNG name must be exactly: `RedragonMouse.png`
3. Restart SignalRGB
4. Select the device — image and LED control should load

## Features
- Static + Canvas lighting modes
- LED flicker filtering
- Frame rate throttle
- Optional save to device memory
- Debug logging (off by default)

## Known Issues
- **Flickering** is due to the cheap controller on the mouse and how the mouse updates it's color, there is no fix for that. To reduce flicker, change the update rate in the settings.


## Roadmap
- [ ] Brightness control
- [ ] Effect presets (wave, breathe, etc.)

## Author
3rr0r
