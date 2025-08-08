// utils/deviceFilters.ts

/**
 * Utility functions to filter Bluetooth and WiFi devices to show only OBD-II/ELM327 adapters
 */

// Common OBD-II related keywords and patterns
const OBD_KEYWORDS = [
  'obd', 'obdii', 'obd-ii', 'elm327', 'elm', 'diagnostic', 'scan', 'scanner',
  'torque', 'car', 'auto', 'vehicle', 'ecu', 'can', 'engine', 'dtc',
  'bluetooth', 'wifi', 'adapter', 'dongle', 'reader', 'tool'
];

// Specific OBD-II device patterns
const OBD_PATTERNS = [
  // ELM327 variations
  /^ELM\s*327/i,
  /^ELM\s*3\s*2\s*7/i,
  
  // OBD variations
  /^OBD.*[2II]/i,
  /^OBDII/i,
  /^OBD-II/i,
  /^OBD.*Link/i,
  /^OBD.*Scan/i,
  /^OBD.*Tool/i,
  
  // WiFi OBD patterns
  /^WiFi.*OBD/i,
  /^OBD.*WiFi/i,
  /^Car.*WiFi/i,
  /^Auto.*WiFi/i,
  
  // Bluetooth OBD patterns
  /^BT.*OBD/i,
  /^OBD.*BT/i,
  /^Bluetooth.*OBD/i,
  /^OBD.*Bluetooth/i,
  
  // Scanner/Diagnostic patterns
  /^Diagnostic/i,
  /^Scanner/i,
  /^Scan.*Tool/i,
  /^Car.*Scan/i,
  /^Auto.*Scan/i,
  
  // Common brand patterns
  /^Torque/i,
  /^Vgate/i,
  /^BAFX/i,
  /^Panlong/i,
  /^Veepeak/i,
  /^BlueDriver/i,
  /^PLX/i,
  /^ScanTool/i,
  /^AutoLink/i,
  /^Launch/i,
  /^Autel/i,
  /^Foxwell/i,
  
  // Generic car/vehicle patterns
  /^Car.*Tool/i,
  /^Vehicle.*Tool/i,
  /^Auto.*Tool/i,
  /^Engine.*Tool/i,
  
  // CAN bus patterns
  /^CAN.*Bus/i,
  /^CAN.*Tool/i,
  /^CAN.*Adapter/i
];

// Known non-OBD device patterns to exclude
const NON_OBD_PATTERNS = [
  /^iPhone/i,
  /^iPad/i,
  /^Android/i,
  /^Samsung/i,
  /^Apple/i,
  /^Google/i,
  /^Pixel/i,
  /^Galaxy/i,
  /^AirPods/i,
  /^Beats/i,
  /^Sony/i,
  /^Bose/i,
  /^JBL/i,
  /^Spotify/i,
  /^Netflix/i,
  /^Amazon/i,
  /^Alexa/i,
  /^Echo/i,
  /^HomePod/i,
  /^Chromecast/i,
  /^Roku/i,
  /^Fire.*TV/i,
  /^Apple.*TV/i
];

/**
 * Check if a Bluetooth device name indicates it's likely an OBD-II adapter
 */
export function isLikelyOBDBluetoothDevice(deviceName: string): boolean {
  if (!deviceName || typeof deviceName !== 'string') {
    return false;
  }

  const name = deviceName.trim();
  if (name.length === 0) {
    return false;
  }

  // Exclude known non-OBD devices
  if (NON_OBD_PATTERNS.some(pattern => pattern.test(name))) {
    return false;
  }

  const lowerName = name.toLowerCase();

  // Check for keyword matches
  const keywordMatch = OBD_KEYWORDS.some(keyword =>
    lowerName.includes(keyword)
  );

  // Check for specific pattern matches
  const patternMatch = OBD_PATTERNS.some(pattern =>
    pattern.test(name)
  );

  // Check for generic patterns that might indicate OBD devices
  const genericPatternMatch = /^[A-Z0-9]{4,}$/i.test(name) && name.length <= 12;

  return keywordMatch || patternMatch || genericPatternMatch;
}

/**
 * Check if a WiFi network name indicates it's likely an OBD-II adapter
 */
export function isLikelyOBDWiFiNetwork(ssid: string): boolean {
  if (!ssid || typeof ssid !== 'string') {
    return false;
  }

  const name = ssid.trim();
  if (name.length === 0) {
    return false;
  }

  const lowerName = name.toLowerCase();

  // Check for keyword matches
  const keywordMatch = OBD_KEYWORDS.some(keyword =>
    lowerName.includes(keyword)
  );

  // Check for specific WiFi OBD patterns
  const wifiPatterns = [
    /^WiFi_?OBD/i,
    /^ELM327/i,
    /^OBD.*WiFi/i,
    /^Car.*WiFi/i,
    /^Auto.*WiFi/i,
    /^Vehicle.*WiFi/i,
    /^Diagnostic.*WiFi/i,
    /^Scan.*WiFi/i
  ];

  const patternMatch = wifiPatterns.some(pattern =>
    pattern.test(name)
  );

  return keywordMatch || patternMatch;
}

/**
 * Filter an array of Bluetooth devices to show only likely OBD-II adapters
 */
export function filterOBDBluetoothDevices(devices: any[]): any[] {
  if (!Array.isArray(devices)) {
    return [];
  }

  return devices.filter(device => {
    // Check device name
    const deviceName = device?.name || device?.deviceName || '';
    if (isLikelyOBDBluetoothDevice(deviceName)) {
      return true;
    }

    // Also check device address patterns (some OBD devices have predictable MAC patterns)
    const address = device?.id || device?.address || '';
    if (address) {
      // Some ELM327 devices have specific MAC address patterns
      const obdMacPatterns = [
        /^00:1D:A5/i,  // Common ELM327 manufacturer prefix
        /^00:0D:18/i,  // Another common OBD manufacturer
        /^20:15:03/i,  // Vgate devices
        /^00:04:3E/i   // Some generic OBD adapters
      ];

      if (obdMacPatterns.some(pattern => pattern.test(address))) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Filter an array of WiFi networks to show only likely OBD-II adapters
 */
export function filterOBDWiFiNetworks(networks: any[]): any[] {
  if (!Array.isArray(networks)) {
    return [];
  }

  return networks.filter(network => {
    const ssid = network?.SSID || network?.ssid || '';
    return isLikelyOBDWiFiNetwork(ssid);
  });
}

/**
 * Enhance device object with OBD-specific metadata
 */
export function enhanceOBDDevice(device: any): any {
  const deviceName = device?.name || device?.deviceName || '';
  const isOBD = isLikelyOBDBluetoothDevice(deviceName);
  
  return {
    ...device,
    isOBD,
    type: isOBD ? 'obd' : (device.type || 'unknown'),
    category: isOBD ? 'OBD-II Adapter' : (device.category || 'Unknown Device')
  };
}

/**
 * Enhance network object with OBD-specific metadata
 */
export function enhanceOBDNetwork(network: any): any {
  const ssid = network?.SSID || network?.ssid || '';
  const isOBD = isLikelyOBDWiFiNetwork(ssid);
  
  return {
    ...network,
    isOBD,
    type: isOBD ? 'obd' : (network.type || 'unknown'),
    category: isOBD ? 'OBD-II Adapter' : (network.category || 'Unknown Network')
  };
}