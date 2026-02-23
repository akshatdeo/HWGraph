# HWGraph

Visualize HWiNFO performance data with interactive charts.

## Features

- Drag & drop CSV file loading
- Interactive time-series charts with ECharts
- Multi-file comparison
- Export charts (PNG, SVG, CSV)
- PWA support (installable web app)
- Dark theme UI

## Quick Start

```bash
npm install
npm run dev
```

The app will open at http://localhost:3000

## Build & Deploy

```bash
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
npm run deploy     # Build + Firebase deploy
```

## Project Structure

```
src/
├── components/
│   ├── SensorTree.tsx          # Hierarchical sensor selector
│   ├── TimeSeriesChart.tsx     # ECharts wrapper with zoom/pan/export
│   └── VisualizationView.tsx   # Layout container (sidebar + chart)
├── utils/
│   ├── csvParser.ts            # HWiNFO CSV parser (PapaParse)
│   ├── chartDataTransform.ts   # Sensor data to ECharts series
│   └── chartExport.ts          # PNG/SVG/CSV export
├── types/
│   └── index.ts                # TypeScript type definitions
├── renderer.tsx                # App entry point
└── index.css                   # Global styles
```

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- ECharts
- PapaParse
- Firebase Hosting

## License

MIT
