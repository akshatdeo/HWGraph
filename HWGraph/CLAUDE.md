# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PerfViz (HWGraph)** is an Electron-based desktop application for visualizing computer performance data exported from HWiNFO as CSV files. The application enables users to load large CSV log files (500+ columns, 100k+ rows), visualize sensor data as interactive charts, and compare performance across multiple sessions.

## Technology Stack

- **Framework**: Electron with Vite
- **Frontend**: React 19 (JSX/upcoming TypeScript migration)
- **Styling**: Tailwind CSS
- **Build System**: Vite + Electron Forge
- **Charting Library**: Apache ECharts (planned) or Recharts
- **Packaging**: Electron Forge (configured for Squirrel, Zip, Deb, RPM)

## Development Commands

### Running the Application
```bash
npm start
# Starts Electron app in development mode with hot reload
```

### Building
```bash
npm run package
# Creates packaged version without installers
```

```bash
npm run make
# Creates distributable installers for the platform (Windows Squirrel, Linux Deb/RPM)
```

### Publishing
```bash
npm run publish
# Publishes the application (requires configuration)
```

### Linting
```bash
npm run lint
# Currently not configured - outputs "No linting configured"
```

## Architecture

### Electron Process Model

The application follows Electron's standard three-process architecture:

1. **Main Process** (`src/main.js`):
   - Manages application lifecycle and window creation
   - Entry point: `src/main.js` (builds to `.vite/build/main.js`)
   - Uses `electron-squirrel-startup` to handle Windows installer events
   - Creates 800x600 window with DevTools open by default
   - Handles macOS-specific behavior (window recreation on activate)

2. **Preload Script** (`src/preload.js`):
   - Currently minimal/empty
   - Bridge between main and renderer processes
   - Will need IPC handlers for file operations when implementing CSV loading

3. **Renderer Process** (`src/renderer.jsx`):
   - React-based UI
   - Entry point: `src/renderer.jsx`
   - Loaded via `index.html` with Vite module resolution

### Vite Configuration

The project uses three separate Vite configs:
- `vite.main.config.mjs`: Main process bundling
- `vite.preload.config.mjs`: Preload script bundling
- `vite.renderer.config.mjs`: Renderer process bundling with React plugin

### Build Output
- Development: Vite dev server (`MAIN_WINDOW_VITE_DEV_SERVER_URL`)
- Production: Static files in `.vite/build/` and `.vite/renderer/`

## Project Status

This is an early-stage project with basic scaffolding complete. The current implementation includes:
- Basic Electron window with React rendering
- Tailwind CSS setup
- Vite build configuration
- Electron Forge packaging setup

### Not Yet Implemented

Key features from the master plan (see `../Instructions.md`) that need implementation:

**Phase 1 (MVP)**:
- CSV parsing for HWiNFO multi-row header format
- File drag-and-drop and file browser dialog
- Hierarchical sensor browser (tree view)
- Interactive charting (ECharts/Recharts integration)
- Basic statistics (min/max/avg)

**Phase 2**:
- Multi-file comparison
- Time alignment options
- Advanced statistics

**Phase 3**:
- Dark/light mode theming
- Export functionality
- Performance optimizations (data downsampling, web workers)

## Data Model

Expected data structures (from master plan):

### HWiNFO CSV Format
- Multi-row headers with Date/Time as first column
- Column format: "Category,Sensor Name,Unit"
- Hundreds of columns (all sensors)
- Thousands to millions of rows
- Polling intervals: 100ms-2000ms
- May contain empty/invalid values

### Core Types (to be implemented in TypeScript)
```typescript
interface LoadedFile {
  id: string;
  filename: string;
  filepath: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  sampleCount: number;
  categories: SensorCategory[];
}

interface SensorCategory {
  id: string;
  name: string; // e.g., "CPU [#0]: Intel Core i7-12700K"
  sensors: Sensor[];
}

interface Sensor {
  id: string;
  categoryId: string;
  name: string; // e.g., "CPU Package"
  unit: string; // e.g., "°C"
  columnIndex: number;
}
```

## File Structure

```
HWGraph/
├── src/
│   ├── main.js         # Electron main process
│   ├── preload.js      # IPC bridge (currently minimal)
│   ├── renderer.jsx    # React entry point
│   └── index.css       # Tailwind imports + basic styles
├── index.html          # HTML shell with root div
├── forge.config.js     # Electron Forge configuration
├── vite.*.config.mjs   # Vite build configs (main/preload/renderer)
├── package.json        # Dependencies and scripts
└── ../Instructions.md  # Master plan and requirements
```

## Key Considerations

### Performance Requirements
- Must handle 500+ column CSVs with 100k+ rows smoothly
- Implement data downsampling (LTTB algorithm recommended)
- Use web workers for CSV parsing
- Consider streaming/chunked file reading

### Windows Platform
- Primary target is Windows
- Squirrel installer configured in forge.config.js
- Handle Windows-specific paths when implementing file operations

### Security (Electron Fuses)
The application has security fuses enabled:
- `RunAsNode`: disabled
- `EnableCookieEncryption`: enabled
- `EnableEmbeddedAsarIntegrityValidation`: enabled
- `OnlyLoadAppFromAsar`: enabled (production)

### Development Workflow
- DevTools are opened automatically in development
- Vite provides hot module replacement
- Changes to main.js require app restart; renderer changes hot reload

## Future Migration Notes

- Project will migrate from `.js/.jsx` to `.ts/.tsx` for type safety
- State management (Zustand recommended) not yet implemented
- IPC handlers need to be added to preload.js for file operations
- Testing infrastructure not yet set up