export function Name() { return "Redragon M908 Mouse"; };
export function Publisher() { return "3rr0r"; };
export function VendorId() { return 0x04D9; };
export function ProductId() { return 0xFC4D; };
export function Size() { return [1, 1]; };
export function LedNames() { return ["LED"]; };
export function LedPositions() { return [[0, 0]]; };

export function ControllableParameters() {
    return [
        { "property": "LightingMode", "label": "Lighting Mode", "type": "combobox", "values": ["Canvas", "Static"], "default": "Canvas" },
        { "property": "staticColor", "label": "Static Color", "type": "color", "default": "#00ff00" },
        { "property": "enableLogging", "label": "Enable Packet Logging", "type": "boolean", "default": "false" },
        { "property": "saveOnUpdate", "label": "Save to Device Memory", "type": "boolean", "default": "false" },
        { "property": "frameThrottleMs", "label": "Frame Throttle (ms)", "type": "number", "min": 0, "max": 1000, "default": 33 },
        { "property": "colorChangeThreshold", "label": "Color Delta Threshold", "type": "number", "min": 0, "max": 255, "default": 5 }
    ];
};

export function Validate(endpoint) {
    device.log(`Validate: Checking endpoint: ${JSON.stringify(endpoint)}`, { toFile: true });
    return (endpoint.interface === 2 && endpoint.usage === 0x0001 && endpoint.usage_page === 0xFFA0);
};

function hexToRgb(hex) {
    if (hex.charAt(0) === '#') hex = hex.substring(1);
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    let num = parseInt(hex, 16);
    return [(num >> 16) & 0xFF, (num >> 8) & 0xFF, num & 0xFF];
}

function logDebug(data) {
    if (typeof enableLogging !== 'undefined' && enableLogging)
        device.log(data, { hex: Array.isArray(data), toFile: true });
}

function sendHidReport(dataArray) {
    if (dataArray.length < 16) dataArray.push(...Array(16 - dataArray.length).fill(0));
    try {
        device.send_report(dataArray, 16);
        return true;
    } catch (e) {
        device.log(`send_report failed: ${e}`, { toFile: true });
        return false;
    }
}

let lastSentColor = [-1, -1, -1];
let lastUpdateTime = 0;

function sendColorsToDevice(r, g, b, save = false) {
    const throttle = typeof frameThrottleMs === 'undefined' ? 33 : frameThrottleMs;
    const threshold = typeof colorChangeThreshold === 'undefined' ? 5 : colorChangeThreshold;
    const now = Date.now();
    if (now - lastUpdateTime < throttle) return;

    const delta = Math.max(
        Math.abs(r - lastSentColor[0]),
        Math.abs(g - lastSentColor[1]),
        Math.abs(b - lastSentColor[2])
    );
    if (delta < threshold) return;

    lastSentColor = [r, g, b];
    lastUpdateTime = now;

    const preConfig = [0x02, 0xF3, 0x46, 0x04, 0x02, ...Array(11).fill(0)];
    logDebug(["PRE", ...preConfig]);
    sendHidReport(preConfig);

    const zones = [0x49, 0x51, 0x59, 0x61, 0x69];
    for (let z of zones) {
        const base = [0x02, 0xF3, z, 0x04, 0x07, 0x00, 0x00, 0x00, r, g, b];
        const footer = (z === 0x49) ? [0x01, 0x00, 0x02, 0x03, 0x00] : [0x02, 0x04, 0x00, 0x02, 0x00];
        const pkt = [...base, ...footer];
        logDebug([`ZONE ${z.toString(16)}`, ...pkt]);
        sendHidReport(pkt);
    }

    const apply = [0x02, 0xF1, 0x02, 0x04, ...Array(12).fill(0)];
    logDebug(["APPLY", ...apply]);
    sendHidReport(apply);

    if (save) {
        const savePkt = [0x02, 0xF3, 0x2C, 0x00, 0x02, ...Array(11).fill(0)];
        logDebug(["SAVE", ...savePkt]);
        sendHidReport(savePkt);
    }
}

export function Render() {
    const [r, g, b] = (LightingMode === "Static") ? hexToRgb(staticColor) : device.color(0, 0);
    sendColorsToDevice(r || 0, g || 0, b || 0, LightingMode === "Static" && saveOnUpdate);
}

export function Shutdown() {
    device.log("Shutdown: setting LED to off", { toFile: true });
    sendColorsToDevice(0, 0, 0, false);
}
