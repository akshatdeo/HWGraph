# HWGraph Web - Performance Visualizer

Web-based version of HWGraph for visualizing HWiNFO performance data.

## Features

- ✅ Drag & drop CSV file loading
- ✅ Browser file picker
- ✅ Interactive charts with ECharts
- ✅ Multi-file comparison
- ✅ Export charts (PNG, SVG, CSV)
- ✅ PWA support (installable web app)
- ✅ Responsive design with Tailwind CSS
- ✅ TypeScript for type safety

## Quick Start

### Development

```bash
npm install
npm run dev
```

The app will open at http://localhost:3000

### Production Build

```bash
npm run build
```

Built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Deployment to Firebase Hosting

### First Time Setup

1. Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Create a new Firebase project at https://console.firebase.google.com

4. Update `.firebaserc` with your Firebase project ID:
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

5. Initialize Firebase Hosting:
```bash
firebase init hosting
```
- Select your Firebase project
- Use `dist` as the public directory
- Configure as a single-page app: Yes
- Don't overwrite files: Yes

### Deploy

```bash
npm run deploy
```

Or manually:
```bash
npm run build
firebase deploy
```

## Project Structure

```
HWGraph-Web/
├── src/
│   ├── components/     # React components
│   │   ├── SensorTree.tsx
│   │   ├── TimeSeriesChart.tsx
│   │   └── VisualizationView.tsx
│   ├── utils/          # Utility functions
│   │   ├── csvParser.ts
│   │   ├── chartDataTransform.ts
│   │   └── chartExport.ts
│   ├── types/          # TypeScript types
│   │   └── index.ts
│   ├── renderer.tsx    # Main app entry point
│   └── index.css       # Global styles
├── public/             # Static assets (icons, etc.)
├── dist/               # Production build output
├── index.html
├── vite.config.ts
├── package.json
├── firebase.json
└── .firebaserc
```

## Key Differences from Electron Version

### File Handling
- **Electron**: Uses Node.js `fs` module to read files from disk
- **Web**: Uses browser FileReader API for dropped/selected files

### Build System
- **Electron**: Uses Electron Forge with multiple Vite configs
- **Web**: Single Vite config for web builds

### Distribution
- **Electron**: Desktop app installers (exe, dmg, deb)
- **Web**: Hosted on Firebase, accessible via URL

## Optional Enhancements (Not Yet Implemented)

### Web Workers for CSV Parsing
For large files, CSV parsing can be moved to a Web Worker to avoid blocking the UI:

1. Create `src/workers/csv-worker.ts`
2. Create `src/hooks/useCSVWorker.ts`
3. Update renderer.tsx to use the worker

See MasterPlan.MD in the parent HWGraph directory for implementation details.

### PWA Icons
Create and add icons to the `public/` directory:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)
- `favicon.ico`

You can use an online icon generator or design tool to create these from a logo.

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers supported

## Technologies Used

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **ECharts** - Interactive charts
- **PapaParse** - CSV parsing
- **Vite PWA Plugin** - Progressive Web App support
- **Firebase Hosting** - Deployment platform

## License

MIT

## Author

Akshat Deo <akshatdeo103@gmail.com>
