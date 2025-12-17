import { createRoot } from 'react-dom/client';
import { useState, useEffect } from 'react';
import './index.css';
import { parseHWiNFOCSV } from './utils/csvParser';
import type { LoadedFile } from './types';
import { VisualizationView } from './components/VisualizationView';

// Extend Window interface for TypeScript
declare global {
  interface Window {
    electronAPI: {
      openFileDialog: () => Promise<string | null>;
      readFile: (filePath: string) => Promise<{
        success: boolean;
        content?: string;
        size?: number;
        filename?: string;
        error?: string;
      }>;
    };
  }
}

const App = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [currentView, setCurrentView] = useState<'landing' | 'visualization'>('landing');
  const [summaryData, setSummaryData] = useState<LoadedFile | null>(null);

  // Helper to extract filename from path
  const getFileName = (filePath: string | null): string => {
    if (!filePath) return '';
    return filePath.split(/[\\/]/).pop() || ''; // works for both Windows and Unix paths
  };

  // Prevent default drag and drop behavior on the entire window
  useEffect(() => {
    const preventDefaults = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Prevent file from being opened in Electron when dropped outside drop zone
    document.addEventListener('dragover', preventDefaults);
    document.addEventListener('drop', preventDefaults);

    return () => {
      document.removeEventListener('dragover', preventDefaults);
      document.removeEventListener('drop', preventDefaults);
    };
  }, []);

  const handleFileSelect = async () => {
    try {
      const filePath = await window.electronAPI.openFileDialog();
      if (filePath) {
        setSelectedFile(filePath);
        setError(null);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      setError('Failed to select file');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // In Electron, we can access the file path directly
    const files = Array.from(e.dataTransfer.files);

    if (files.length > 0) {
      const file = files[0];

      // Log for debugging
      console.log('Dropped file:', file);
      console.log('File path:', (file as any).path);
      console.log('File name:', file.name);

      // Electron provides the path property on File objects
      const filePath = (file as any).path || file.name;
      const fileName = file.name || '';

      // Check if it's a CSV file using both path and name
      if (fileName.toLowerCase().endsWith('.csv')) {
        setSelectedFile(filePath);
        setError(null);
        console.log('File accepted:', filePath);
      } else {
        console.log('File rejected - not a CSV:', fileName);
        setError('Please drop a CSV file (received: ' + fileName + ')');
      }
    }
  };

  const handleLoadFile = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('Reading file:', selectedFile);

      // Read file contents
      const result = await window.electronAPI.readFile(selectedFile);

      if (!result.success || !result.content) {
        throw new Error(result.error || 'Failed to read file');
      }

      console.log('File read successfully, size:', result.size);
      console.log('Parsing CSV...');

      // Parse CSV
      const parseResult = parseHWiNFOCSV(
        result.content,
        selectedFile,
        result.filename || getFileName(selectedFile)
      );

      if (!parseResult.success || !parseResult.data) {
        throw new Error(parseResult.error || 'Failed to parse CSV');
      }

      console.log('CSV parsed successfully!');
      console.log('Categories:', parseResult.data.categories.length);
      console.log('Samples:', parseResult.data.sampleCount);
      console.log('Duration:', parseResult.data.duration / 1000, 'seconds');

      // Add to loaded files
      setLoadedFiles(prev => [...prev, parseResult.data]);
      setSummaryData(parseResult.data);
      setShowSummary(true);
    } catch (error) {
      console.error('Error loading file:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Render visualization view if files are loaded and view is set
  if (currentView === 'visualization') {
    return (
      <VisualizationView
        files={loadedFiles}
        onLoadMore={() => setCurrentView('landing')}
        onBack={() => setCurrentView('landing')}
      />
    );
  }

  // Landing view
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-8">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            HWGraph
          </h1>
          <p className="text-2xl text-gray-300 font-medium mb-3">
            Visualize HWiNFO Performance Data
          </p>
          <p className="text-base text-gray-400 max-w-xl mx-auto">
            Load CSV log files and analyze your system's performance with interactive charts
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-700 rounded-xl p-4">
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* File Selection Area */}
        <div className="space-y-6">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-xl p-16 text-center transition-all duration-200 cursor-pointer
              ${
                isDragging
                  ? 'border-blue-400 bg-blue-500/10 scale-[1.02] shadow-lg shadow-blue-500/20'
                  : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
              }
            `}
          >
            <div className="flex flex-col items-center space-y-6">
              <svg
                className={`w-20 h-20 transition-colors ${isDragging ? 'text-blue-400' : 'text-gray-500'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <div>
                <p className="text-xl font-semibold text-gray-200 mb-2">
                  Drop your CSV file here
                </p>
                <p className="text-base text-gray-400">or</p>
              </div>
              <button
                onClick={handleFileSelect}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Browse Files
              </button>
            </div>
          </div>

          {/* Selected File Display */}
          {selectedFile && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-2 font-medium uppercase tracking-wide">
                    Selected file:
                  </p>
                  <p className="text-gray-100 font-mono text-lg break-all">
                    {getFileName(selectedFile)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setError(null);
                  }}
                  className="ml-4 text-gray-400 hover:text-gray-200 transition-colors p-1"
                  title="Clear selection"
                  disabled={isLoading}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-6">
                <button
                  onClick={handleLoadFile}
                  disabled={isLoading}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-base font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:scale-100 disabled:shadow-none flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Loading...
                    </>
                  ) : (
                    'Load File'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Info */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <p className="text-center text-gray-500 text-base">Supported format: HWiNFO CSV log files</p>
        </div>
      </div>

      {/* Load Summary Modal */}
      {showSummary && summaryData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 px-8 py-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-2xl font-bold text-white">File Loaded Successfully</h2>
                </div>
                <button
                  onClick={() => setShowSummary(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-8 py-6 space-y-6">
              {/* File Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-3">File Information</h3>
                <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Filename:</span>
                    <span className="text-gray-200 font-mono">{summaryData.filename}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-gray-200">{(summaryData.duration / 1000).toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Samples:</span>
                    <span className="text-gray-200">{summaryData.sampleCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time Range:</span>
                    <span className="text-gray-200 text-sm">
                      {summaryData.startTime.toLocaleString()} - {summaryData.endTime.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sensor Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-3">Sensor Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                    <div className="text-3xl font-bold text-blue-400">{summaryData.metrics.totalSensors}</div>
                    <div className="text-sm text-gray-400 mt-1">Total Sensors</div>
                  </div>
                  <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-4">
                    <div className="text-3xl font-bold text-purple-400">{summaryData.metrics.totalCategories}</div>
                    <div className="text-sm text-gray-400 mt-1">Categories</div>
                  </div>
                  <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4">
                    <div className="text-3xl font-bold text-green-400">{summaryData.metrics.totalDataPoints.toLocaleString()}</div>
                    <div className="text-sm text-gray-400 mt-1">Data Points</div>
                  </div>
                  <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4">
                    <div className="text-3xl font-bold text-yellow-400">{summaryData.metrics.dataCompleteness.toFixed(1)}%</div>
                    <div className="text-sm text-gray-400 mt-1">Completeness</div>
                  </div>
                </div>
              </div>

              {/* Categories Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-3">Categories Detected</h3>
                <div className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {summaryData.categories.map((category) => (
                      <div key={category.id} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                        <span className="text-gray-300">{category.name}</span>
                        <span className="text-gray-400 text-sm bg-gray-800 px-3 py-1 rounded-full">
                          {category.sensors.length} sensor{category.sensors.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {summaryData.metrics.warnings.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-200 mb-3">Notifications</h3>
                  <div className="space-y-2">
                    {summaryData.metrics.warnings.map((warning, index) => (
                      <div
                        key={index}
                        className={`rounded-lg p-4 flex items-start gap-3 ${
                          warning.type === 'error'
                            ? 'bg-red-900/20 border border-red-700'
                            : warning.type === 'warning'
                            ? 'bg-yellow-900/20 border border-yellow-700'
                            : 'bg-blue-900/20 border border-blue-700'
                        }`}
                      >
                        <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          warning.type === 'error'
                            ? 'text-red-400'
                            : warning.type === 'warning'
                            ? 'text-yellow-400'
                            : 'text-blue-400'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={`text-sm ${
                          warning.type === 'error'
                            ? 'text-red-300'
                            : warning.type === 'warning'
                            ? 'text-yellow-300'
                            : 'text-blue-300'
                        }`}>{warning.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setShowSummary(false)}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Load Another File
                </button>
                <button
                  onClick={() => {
                    setShowSummary(false);
                    setCurrentView('visualization');
                  }}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Visualize Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
