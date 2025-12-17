# Master Prompt: HWInfo CSV Performance Visualizer

## Project Overview

I want to build a Windows desktop application called **"PerfViz"** (or suggest a better name) that visualizes computer performance data exported from HWiNFO as CSV files.

### Core Purpose
- Load HWiNFO CSV log files
- Visualize sensor data as interactive charts
- Compare data across multiple CSV files
- Help users analyze gaming sessions, stress tests, or general system performance

---

## Technology Stack

**Framework:** Electron
**Frontend:** React + TypeScript
**Charting Library:** Apache ECharts (preferred for large dataset handling) or Recharts
**Styling:** Tailwind CSS
**Build Tool:** Vite
**Packaging:** electron-builder

---

## HWiNFO CSV Format Reference

The Data folder contains a CSV file that will contain all the data HWINFO outputs, use this as a datapoint to know what all data will be output. 

The CSV may have:
- Hundreds of columns (many sensors)
- Thousands to millions of rows (long logging sessions)
- Varying polling intervals (typically 100ms to 2000ms)
- Some columns may have empty/invalid values

---

## Feature Requirements

### Phase 1: Core Functionality (MVP)

#### File Management
- [ ] Drag-and-drop CSV loading
- [ ] File browser dialog
- [ ] Recent files list (persisted between sessions)
- [ ] Support for multiple files loaded simultaneously
- [ ] Display file metadata (duration, sample count, date range)

#### CSV Parsing
- [ ] Parse HWiNFO's multi-row header format correctly
- [ ] Auto-detect timestamp column and format
- [ ] Handle large files efficiently (streaming or chunked parsing)
- [ ] Detect and handle invalid/empty values gracefully
- [ ] Build a sensor tree: Category → Sensor → Unit

#### Sensor Selection
- [ ] Hierarchical sensor browser (tree view)
- [ ] Search/filter sensors by name
- [ ] Quick-select common sensors (CPU temp, GPU temp, FPS, etc.)
- [ ] Remember last-used sensor selections
- [ ] Sensor groups/presets (e.g., "Temperatures", "Power", "Clocks")

#### Charting
- [ ] Line charts for time-series data
- [ ] Interactive zoom (scroll wheel + drag to select range)
- [ ] Pan across time axis
- [ ] Tooltips showing exact values at cursor position
- [ ] Legend with show/hide toggles per series
- [ ] Auto-scaling Y-axis with manual override option
- [ ] Multiple Y-axes for different units (e.g., temp vs power)

#### Basic Statistics
- [ ] Show min/max/avg for each visible series
- [ ] Display in sidebar or as overlay on chart

### Phase 2: Comparison Features

#### Multi-File Comparison
- [ ] Load 2+ CSV files for comparison
- [ ] Time alignment options:
  - Align by start time (overlay from t=0)
  - Align by absolute timestamp
  - Manual offset adjustment
- [ ] Visual differentiation (colors, line styles, labels)
- [ ] Side-by-side chart view option
- [ ] Synchronized zoom/pan across comparison charts

#### Advanced Statistics
- [ ] Comparison table (File A vs File B stats)
- [ ] Percentile calculations (95th, 99th)
- [ ] Time-above-threshold analysis (e.g., "GPU was above 80°C for 12% of session")

### Phase 3: Polish & Advanced Features

#### UI/UX
- [ ] Dark mode (default) + light mode toggle
- [ ] Customizable color schemes for charts
- [ ] Resizable panels (sidebar, chart area)
- [ ] Keyboard shortcuts (Ctrl+O open, Ctrl+scroll zoom, etc.)
- [ ] Responsive layout

#### Export & Sharing
- [ ] Export chart as PNG/SVG
- [ ] Export selected data range as new CSV
- [ ] Copy statistics to clipboard
- [ ] Save/load session configurations

#### Performance Optimizations
- [ ] Data downsampling for large files (LTTB algorithm or similar)
- [ ] Virtual scrolling in sensor list
- [ ] Web workers for CSV parsing
- [ ] Lazy loading of chart data

#### Nice-to-Have
- [ ] Annotations (mark points of interest on charts)
- [ ] Threshold lines (e.g., show 80°C warning line)
- [ ] Correlation view (scatter plot of sensor A vs sensor B)
- [ ] Histogram view for value distribution
- [ ] Session notes/comments

---

## UI Layout Concept

```
┌─────────────────────────────────────────────────────────────────┐
│  Menu Bar: File | View | Tools | Help                           │
├─────────────┬───────────────────────────────────────────────────┤
│             │  Toolbar: [Open] [Compare] [Export] [Settings]    │
│   Sensor    ├───────────────────────────────────────────────────┤
│   Browser   │                                                   │
│             │                                                   │
│  □ CPU      │              Main Chart Area                      │
│    □ Temp   │                                                   │
│    □ Power  │         [Interactive ECharts Graph]               │
│  □ GPU      │                                                   │
│    □ Temp   │                                                   │
│    □ Clock  │                                                   │
│             ├───────────────────────────────────────────────────┤
│  [Search]   │  Statistics Panel: Min | Max | Avg | 95th         │
├─────────────┴───────────────────────────────────────────────────┤
│  Status Bar: File: gaming_session.csv | Duration: 1h 23m | ...  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
perfviz/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── index.ts
│   │   ├── menu.ts
│   │   └── ipc-handlers.ts
│   ├── renderer/             # React frontend
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   ├── SensorBrowser/
│   │   │   ├── Chart/
│   │   │   ├── Statistics/
│   │   │   └── FileManager/
│   │   ├── hooks/
│   │   ├── stores/           # State management (Zustand recommended)
│   │   ├── utils/
│   │   │   ├── csvParser.ts
│   │   │   ├── dataProcessing.ts
│   │   │   └── chartHelpers.ts
│   │   └── types/
│   │       └── index.ts
│   └── preload/
│       └── index.ts
├── electron-builder.yml
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## Data Types (TypeScript)

```typescript
interface SensorCategory {
  id: string;
  name: string;           // e.g., "CPU [#0]: Intel Core i7-12700K"
  sensors: Sensor[];
}

interface Sensor {
  id: string;
  categoryId: string;
  name: string;           // e.g., "CPU Package"
  unit: string;           // e.g., "°C"
  columnIndex: number;    // Position in CSV
}

interface DataPoint {
  timestamp: number;      // Unix milliseconds
  value: number | null;   // null for invalid/missing
}

interface SensorData {
  sensor: Sensor;
  data: DataPoint[];
  stats: SensorStats;
}

interface SensorStats {
  min: number;
  max: number;
  avg: number;
  percentile95: number;
  percentile99: number;
  validCount: number;
  invalidCount: number;
}

interface LoadedFile {
  id: string;
  filename: string;
  filepath: string;
  loadedAt: Date;
  startTime: Date;
  endTime: Date;
  duration: number;       // milliseconds
  sampleCount: number;
  categories: SensorCategory[];
}

interface ChartSeries {
  fileId: string;
  sensorId: string;
  color: string;
  visible: boolean;
  yAxisId: string;
}

interface AppState {
  files: LoadedFile[];
  selectedSensors: string[];    // sensor IDs
  chartSeries: ChartSeries[];
  timeRange: [number, number];  // visible range
  comparisonMode: boolean;
  theme: 'dark' | 'light';
}
```

---

## Development Approach

Please help me build this application incrementally:

1. **Start with project scaffolding** - Set up Electron + React + Vite + TypeScript + Tailwind
2. **Build CSV parser** - Handle HWiNFO format, test with sample files
3. **Create basic UI shell** - Layout with placeholder components
4. **Implement sensor browser** - Tree view with selection
5. **Add charting** - Single file, single sensor first, then expand
6. **Add multi-sensor support** - Multiple series on one chart
7. **Implement statistics** - Basic stats panel
8. **Add comparison mode** - Multi-file loading and alignment
9. **Polish UI** - Theming, responsiveness, keyboard shortcuts
10. **Package for distribution** - electron-builder setup

---

## Constraints & Preferences

- **Performance is critical** - Must handle 500+ column CSVs with 100k+ rows smoothly
- **Offline-first** - No internet connection required
- **Windows primary** - Optimize for Windows, but keep cross-platform possible
- **Modern aesthetic** - Dark theme default, clean and professional look
- **Accessible** - Proper contrast ratios, keyboard navigation

---

## Sample Prompts to Continue Development

After initial setup, I may ask things like:
- "Add support for parsing the CSV headers"
- "Implement the sensor tree view component"
- "Add zoom and pan to the chart"
- "Make the chart show multiple Y-axes for different units"
- "Add a comparison mode for two files"
- "Optimize CSV parsing for large files"
- "Set up electron-builder for Windows"

---

## Questions to Clarify (Ask Me If Needed)

1. Do I have a sample HWiNFO CSV file to test with?
2. What's the typical file size I'll be working with?
3. Are there specific sensors I care about most?
4. Do I need real-time log watching (tail -f style)?
5. Any specific color scheme or branding preferences?

---

Let's start building! Please begin with Phase 1, Step 1: Project scaffolding.