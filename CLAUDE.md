# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native/Expo application for OBD-II vehicle diagnostics. The app connects to ELM327 OBD-II adapters via Bluetooth or WiFi to read real-time vehicle data, display diagnostics, and generate reports. It includes a comprehensive simulation mode for testing without actual hardware.

## Development Commands

### Core Commands
- `npm install` - Install dependencies
- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Start web version
- `npm run lint` - Run ESLint for code quality
- `npm run reset-project` - Reset to blank project template

### Testing
- No specific test commands configured - check if Jest tests exist before running

## Architecture Overview

### Navigation Structure
- **Expo Router**: File-based routing with stack and tab navigation
- **Root Layout**: `app/_layout.tsx` - Main app wrapper with Redux provider
- **Tab Navigation**: `app/(tabs)/_layout.tsx` - Bottom tab navigation
- **Main Screens**: Dashboard, Diagnostics, History, Settings
- **Modal Screens**: Vehicle Profile, Alerts, Reports

### State Management
- **Redux Toolkit**: Centralized state management
- **Redux Persist**: Persists settings and vehicle data, excludes connection and real-time data
- **Store Structure**: Connection, Data, Settings, Vehicle reducers

### Services Architecture

#### Core Services
- **OBDIIService**: Central coordinator for all OBD-II operations
  - Connection management (Bluetooth/WiFi/Simulation)
  - Command queuing and response handling
  - PID discovery and polling
  - Event emission for data updates

- **BluetoothService**: Handles Bluetooth communication
  - Device discovery and pairing
  - ELM327 adapter communication
  - Connection state management

- **WiFiManager**: Manages WiFi-based OBD connections
  - Network scanning and connection
  - UDP/TCP communication with adapters

- **SimulationService**: Provides mock data for testing
  - Realistic vehicle data generation
  - Supports all dashboard PIDs
  - Configurable simulation parameters

#### Data Services
- **DatabaseService**: SQLite-based data persistence
- **OBDIIParser**: Parses raw OBD-II responses into structured data
- **PIDDefinitions**: Registry of supported OBD-II Parameter IDs

#### Utility Services
- **AlertService**: Manages diagnostic alerts and thresholds
- **ExportService**: Handles data export (CSV, PDF)
- **NotificationService**: Push notifications for alerts

### Key Components

#### Connection Flow
1. User selects connection type (Bluetooth/WiFi/Simulation)
2. OBDIIService coordinates with appropriate communication service
3. Adapter initialization with AT commands
4. PID discovery to determine supported parameters
5. Live data polling begins for dashboard display

#### Data Flow
1. Raw OBD responses received by communication service
2. OBDIIParser converts hex responses to structured data
3. Parsed data emitted via OBDIIService events
4. Redux state updated with new data
5. UI components react to state changes

### File Organization
- **app/**: Expo Router screens and navigation
- **components/**: Reusable UI components (charts, gauges, common)
- **services/**: Core business logic and external integrations
- **store/**: Redux store configuration and reducers
- **utils/**: Helper functions and constants
- **hooks/**: Custom React hooks (e.g., useLiveOBDData)

## Development Notes

### TypeScript Configuration
- Strict mode enabled
- Path aliases configured (`@/*` maps to root)
- Mixed TypeScript/JavaScript codebase (gradual migration)

### OBD-II Implementation
- Supports ELM327 command set
- Handles Mode 01 (Live Data) and Mode 03 (Stored DTCs)
- Automatic protocol detection
- Robust error handling and retry logic

### Connection Management
- Supports multiple connection types simultaneously
- Graceful fallback to simulation mode
- Automatic reconnection attempts
- Connection state persistence

### Data Handling
- Real-time data streaming with configurable intervals
- Historical data storage with cleanup policies
- Export functionality for diagnostics and reports
- Alert system with customizable thresholds

## Platform-Specific Considerations

### Android
- Bluetooth permissions required (BLUETOOTH_CONNECT, BLUETOOTH_SCAN, ACCESS_FINE_LOCATION)
- Network security configuration for WiFi connections
- File provider configuration for exports

### iOS
- Bluetooth permissions handled automatically
- Network configuration for local connections
- Document picker integration for imports

### Development Tools
- ESLint with React Native specific rules
- TypeScript strict mode
- Expo development tools
- Metro bundler configuration