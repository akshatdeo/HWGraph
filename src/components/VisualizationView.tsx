import { useState, useEffect } from 'react';
import type { LoadedFile } from '../types';
import { SensorTree } from './SensorTree';
import { TimeSeriesChart } from './TimeSeriesChart';

interface VisualizationViewProps {
  files: LoadedFile[];
  onLoadMore: () => void;
  onBack: () => void;
  onDeleteFile: (fileId: string) => void;
}

export function VisualizationView({ files, onLoadMore, onBack, onDeleteFile }: VisualizationViewProps) {
  const [selectedSensors, setSelectedSensors] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  // Debug: Log files on mount and changes
  useEffect(() => {
    console.log('VisualizationView mounted/updated with files:', files.length);
    console.log('Files:', files);
    if (files.length > 0) {
      console.log('First file categories:', files[0].categories.length);
      console.log('First file rawData keys:', Array.from(files[0].rawData.keys()));
    }
  }, [files]);

  // Auto-expand first file and first category on mount
  useEffect(() => {
    if (files.length > 0 && expandedFiles.size === 0) {
      // Expand first file
      setExpandedFiles(new Set([files[0].id]));

      // Expand first category of first file
      if (files[0].categories.length > 0 && expandedCategories.size === 0) {
        const firstCategoryKey = `${files[0].id}:${files[0].categories[0].id}`;
        console.log('Auto-expanding first category:', firstCategoryKey);
        setExpandedCategories(new Set([firstCategoryKey]));
      }
    }
  }, [files]);

  const handleToggleSensor = (fileId: string, sensorId: string) => {
    const key = `${fileId}:${sensorId}`;
    console.log('Toggling sensor:', key);
    setSelectedSensors((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        console.log('Removing sensor:', key);
        next.delete(key);
      } else {
        console.log('Adding sensor:', key);
        next.add(key);
      }
      console.log('Total selected sensors:', next.size);
      console.log('Selected sensors:', Array.from(next));
      return next;
    });
  };

  const handleToggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryKey)) {
        next.delete(categoryKey);
      } else {
        next.add(categoryKey);
      }
      return next;
    });
  };

  const handleToggleFile = (fileId: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const handleDeleteFile = (fileId: string) => {
    // Call parent's delete handler to remove from files array
    onDeleteFile(fileId);

    // Remove file from expanded files
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      next.delete(fileId);
      return next;
    });

    // Remove all sensors from this file from selected sensors
    setSelectedSensors((prev) => {
      const next = new Set(prev);
      Array.from(next).forEach((key) => {
        if (key.startsWith(`${fileId}:`)) {
          next.delete(key);
        }
      });
      return next;
    });

    // Remove all categories from this file from expanded categories
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      Array.from(next).forEach((key) => {
        if (key.startsWith(`${fileId}:`)) {
          next.delete(key);
        }
      });
      return next;
    });
  };

  const handleSelectAll = () => {
    const allSensorKeys = new Set<string>();
    files.forEach((file) => {
      file.categories.forEach((category) => {
        category.sensors.forEach((sensor) => {
          allSensorKeys.add(`${file.id}:${sensor.id}`);
        });
      });
    });
    setSelectedSensors(allSensorKeys);
  };

  return (
    <div className="h-screen bg-gray-900 text-gray-100 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-200 transition-colors"
            title="Back to file loader"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            HWGraph
          </h1>
          <span className="text-gray-500">|</span>
          <span className="text-gray-300">{files.length} file{files.length > 1 ? 's' : ''} loaded</span>
        </div>
        <button
          onClick={onLoadMore}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Load Another File
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Sensor Selector */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-700 flex-shrink-0">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sensors..."
                className="w-full px-4 py-2 pl-10 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Selection Summary */}
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
            <span className="text-sm text-gray-400">
              {selectedSensors.size} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Select All
              </button>
              <span className="text-gray-600">|</span>
              <button
                onClick={() => setSelectedSensors(new Set())}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Sensor Tree */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <SensorTree
              files={files}
              selectedSensors={selectedSensors}
              onToggleSensor={handleToggleSensor}
              searchQuery={searchQuery}
              expandedCategories={expandedCategories}
              onToggleCategory={handleToggleCategory}
              expandedFiles={expandedFiles}
              onToggleFile={handleToggleFile}
              onDeleteFile={handleDeleteFile}
            />
          </div>
        </div>

        {/* Right Area - Chart */}
        <div className="flex-1 flex flex-col bg-gray-900 min-h-0">
          <TimeSeriesChart files={files} selectedSensors={selectedSensors} />
        </div>
      </div>
    </div>
  );
}
