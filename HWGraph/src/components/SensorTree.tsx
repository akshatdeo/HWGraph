import { useState } from 'react';
import type { LoadedFile, SensorCategory, Sensor } from '../types';

interface SensorTreeProps {
  files: LoadedFile[];
  selectedSensors: Set<string>;
  onToggleSensor: (fileId: string, sensorId: string) => void;
  searchQuery: string;
  expandedCategories: Set<string>;
  onToggleCategory: (categoryKey: string) => void;
}

export function SensorTree({
  files,
  selectedSensors,
  onToggleSensor,
  searchQuery,
  expandedCategories,
  onToggleCategory,
}: SensorTreeProps) {
  // Color palette for sensor indicators
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#6366f1', // indigo
    '#14b8a6', // teal
  ];

  // Get color for a sensor (consistent based on index)
  const getSensorColor = (index: number) => colors[index % colors.length];

  // Filter sensors based on search query
  const filterSensor = (sensor: Sensor, category: SensorCategory): boolean => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      sensor.name.toLowerCase().includes(query) ||
      sensor.unit.toLowerCase().includes(query) ||
      category.name.toLowerCase().includes(query)
    );
  };

  // Check if category has any matching sensors
  const categoryHasMatches = (category: SensorCategory): boolean => {
    if (!searchQuery) return true;
    return category.sensors.some((sensor) => filterSensor(sensor, category));
  };

  // Get unique key for category (file + category)
  const getCategoryKey = (fileId: string, categoryId: string) => `${fileId}:${categoryId}`;

  // Get unique key for sensor (file + sensor)
  const getSensorKey = (fileId: string, sensorId: string) => `${fileId}:${sensorId}`;

  // Count selected sensors in a category
  const getSelectedCountInCategory = (fileId: string, category: SensorCategory): number => {
    return category.sensors.filter((sensor) =>
      selectedSensors.has(getSensorKey(fileId, sensor.id))
    ).length;
  };

  // Toggle all sensors in a category
  const toggleCategory = (fileId: string, category: SensorCategory) => {
    const selectedCount = getSelectedCountInCategory(fileId, category);
    const visibleSensors = category.sensors.filter((sensor) => filterSensor(sensor, category));

    if (selectedCount === visibleSensors.length) {
      // All selected, deselect all
      visibleSensors.forEach((sensor) => {
        if (selectedSensors.has(getSensorKey(fileId, sensor.id))) {
          onToggleSensor(fileId, sensor.id);
        }
      });
    } else {
      // Not all selected, select all
      visibleSensors.forEach((sensor) => {
        if (!selectedSensors.has(getSensorKey(fileId, sensor.id))) {
          onToggleSensor(fileId, sensor.id);
        }
      });
    }
  };

  return (
    <div className="space-y-2">
      {files.map((file, fileIndex) => (
        <div key={file.id}>
          {/* File Header (only show if multiple files) */}
          {files.length > 1 && (
            <div className="mb-3 pb-2 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-semibold text-gray-300 truncate">{file.filename}</span>
              </div>
            </div>
          )}

          {/* Categories */}
          {file.categories.map((category) => {
            if (!categoryHasMatches(category)) return null;

            const categoryKey = getCategoryKey(file.id, category.id);
            const isExpanded = expandedCategories.has(categoryKey);
            const visibleSensors = category.sensors.filter((sensor) => filterSensor(sensor, category));
            const selectedCount = getSelectedCountInCategory(file.id, category);
            const allSelected = selectedCount === visibleSensors.length && visibleSensors.length > 0;
            const someSelected = selectedCount > 0 && selectedCount < visibleSensors.length;

            return (
              <div key={categoryKey} className="mb-1">
                {/* Category Header */}
                <div
                  className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors group"
                  onClick={() => onToggleCategory(categoryKey)}
                >
                  {/* Expand/Collapse Icon */}
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>

                  {/* Category Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(file.id, category);
                    }}
                    className="flex-shrink-0"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      allSelected
                        ? 'bg-blue-600 border-blue-600'
                        : someSelected
                        ? 'bg-blue-600/50 border-blue-600'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}>
                      {allSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {someSelected && !allSelected && (
                        <div className="w-2 h-2 bg-white rounded-sm" />
                      )}
                    </div>
                  </button>

                  {/* Category Name */}
                  <span className="flex-1 text-sm font-medium text-gray-300 truncate" title={category.name}>
                    {category.name}
                  </span>

                  {/* Sensor Count Badge */}
                  <span className="flex-shrink-0 text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
                    {visibleSensors.length}
                  </span>
                </div>

                {/* Sensors List */}
                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {visibleSensors.map((sensor, sensorIndex) => {
                      const sensorKey = getSensorKey(file.id, sensor.id);
                      const isSelected = selectedSensors.has(sensorKey);
                      const globalIndex = fileIndex * 1000 + sensorIndex; // Ensure unique color per sensor
                      const color = getSensorColor(globalIndex);

                      return (
                        <div
                          key={sensor.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-700/30 cursor-pointer transition-colors group"
                          onClick={() => onToggleSensor(file.id, sensor.id)}
                        >
                          {/* Sensor Checkbox */}
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-600 group-hover:border-gray-500'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>

                          {/* Color Indicator */}
                          {isSelected && (
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: color }}
                            />
                          )}

                          {/* Sensor Name */}
                          <span className="flex-1 text-sm text-gray-400 group-hover:text-gray-300 truncate" title={sensor.name}>
                            {sensor.name}
                          </span>

                          {/* Unit Badge */}
                          {sensor.unit && (
                            <span className="flex-shrink-0 text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded font-mono">
                              {sensor.unit}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* No results message */}
      {searchQuery && files.every((file) => file.categories.every((cat) => !categoryHasMatches(cat))) && (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm">No sensors match "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}
