import { createRoot } from 'react-dom/client';
import { useState, useEffect } from 'react';
import './index.css';

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null); // stores full path
  const [isDragging, setIsDragging] = useState(false);

  // Helper to extract filename from path
  const getFileName = (filePath) => {
    if (!filePath) return '';
    return filePath.split(/[\\/]/).pop(); // works for both Windows and Unix paths
  };

  // Prevent default drag and drop behavior on the entire window
  useEffect(() => {
    const preventDefaults = (e) => {
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
      }
    } catch (error) {
      console.error('Error selecting file:', error);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // In Electron, we can access the file path directly
    const files = Array.from(e.dataTransfer.files);

    if (files.length > 0) {
      const file = files[0];

      // Log for debugging
      console.log('Dropped file:', file);
      console.log('File path:', file.path);
      console.log('File name:', file.name);

      // Electron provides the path property on File objects
      const filePath = file.path || file.name;
      const fileName = file.name || '';

      // Check if it's a CSV file using both path and name
      if (fileName.toLowerCase().endsWith('.csv')) {
        setSelectedFile(filePath);
        console.log('File accepted:', filePath);
      } else {
        console.log('File rejected - not a CSV:', fileName);
        alert('Please drop a CSV file (received: ' + fileName + ')');
      }
    }
  };

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

        {/* File Selection Area */}
        <div className="space-y-6">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-xl p-16 text-center transition-all duration-200 cursor-pointer
              ${isDragging
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
                <p className="text-base text-gray-400">
                  or
                </p>
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
                  <p className="text-sm text-gray-400 mb-2 font-medium uppercase tracking-wide">Selected file:</p>
                  <p className="text-gray-100 font-mono text-lg break-all">
                    {getFileName(selectedFile)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="ml-4 text-gray-400 hover:text-gray-200 transition-colors p-1"
                  title="Clear selection"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-6">
                <button className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white text-base font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105">
                  Load File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Info */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <p className="text-center text-gray-500 text-base">
            Supported format: HWiNFO CSV log files
          </p>
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);