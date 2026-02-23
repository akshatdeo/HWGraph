# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server on http://localhost:3000
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
npm run deploy     # Build + Firebase deploy
```

No test runner or linter is configured.

## Architecture

This is a **React 19 + TypeScript + Vite** single-page application for visualizing HWiNFO CSV performance logs. It was migrated from an Electron desktop app to a web PWA.

### Data Flow

1. User drops/selects a CSV file (browser FileReader API, no Node.js `fs`)
2. `csvParser.ts` parses the HWiNFO multi-header CSV format via PapaParse — extracts categories, sensors, timestamps (DD.MM.YYYY HH:MM:SS.mmm), and data points
3. A `LoadedFile` object is created containing metadata, `SensorCategory[]`, and `rawData` as `Map<number, DataPoint[]>` (keyed by column index)
4. `renderer.tsx` manages app state (landing vs visualization view, loaded files, selected sensors) using React hooks — no external state management
5. `chartDataTransform.ts` converts selected sensor data to ECharts series, grouping by unit for multi-Y-axis support, with LTTB downsampling for performance
6. `chartExport.ts` handles PNG/SVG/CSV export from the chart instance

### Key Components

- **`renderer.tsx`** — App entry point; file handling (drag-and-drop + file picker), view routing, load summary modal
- **`VisualizationView.tsx`** — Layout container with left sidebar (SensorTree) and main chart area (TimeSeriesChart)
- **`SensorTree.tsx`** — Hierarchical sensor selector (Files → Categories → Sensors) with search, checkboxes, color indicators
- **`TimeSeriesChart.tsx`** — ECharts wrapper with zoom/pan, tooltips, export menu, reset view

### Selection Keys

Sensor selection uses composite keys in the format `{fileId}:{sensorId}` stored in a `Set` for multi-file support.

### Type Definitions

All types live in `src/types/index.ts`. Key types: `LoadedFile`, `SensorCategory`, `Sensor`, `DataPoint`, `SensorStats`, `ParseMetrics`.

### Build Configuration

- Path alias: `@/` → `src/`
- Manual chunk splitting: `echarts`, `vendor` (React/ReactDOM), `csv-parser` (PapaParse)
- PWA via `vite-plugin-pwa` with workbox service worker
- Firebase Hosting configured for SPA (all routes rewrite to `index.html`)

### Styling

Tailwind CSS 3 with a dark theme. No custom design system or component library.
