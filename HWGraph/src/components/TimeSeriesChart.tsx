import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { ECharts } from 'echarts';
import type { LoadedFile } from '../types';
import { transformToChartData, createChartOption } from '../utils/chartDataTransform';

interface TimeSeriesChartProps {
  files: LoadedFile[];
  selectedSensors: Set<string>;
}

export function TimeSeriesChart({ files, selectedSensors }: TimeSeriesChartProps) {
  console.log('TimeSeriesChart rendered with:', files.length, 'files,', selectedSensors.size, 'selected sensors');
  console.log('Selected sensors:', Array.from(selectedSensors));

  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<ECharts | null>(null);

  // Initialize chart
  useEffect(() => {
    try {
      console.log('TimeSeriesChart: Initialize chart effect STARTED');
      if (!chartRef.current) {
        console.log('TimeSeriesChart: chartRef.current is null!');
        return;
      }
      console.log('TimeSeriesChart: chartRef.current exists:', chartRef.current);
      console.log('TimeSeriesChart: Creating echarts instance');

      // Create chart instance
      chartInstanceRef.current = echarts.init(chartRef.current, 'dark', {
        renderer: 'canvas',
      });

      console.log('TimeSeriesChart: ECharts instance created:', chartInstanceRef.current);

      // Handle window resize
      const handleResize = () => {
        chartInstanceRef.current?.resize();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        console.log('TimeSeriesChart: Cleanup running');
        window.removeEventListener('resize', handleResize);
        chartInstanceRef.current?.dispose();
        chartInstanceRef.current = null;
      };
    } catch (error) {
      console.error('TimeSeriesChart: Error in initialize effect:', error);
    }
  }, []);

  // Update chart when data changes
  useEffect(() => {
    try {
      console.log('TimeSeriesChart: Update chart effect STARTED');
      console.log('chartInstanceRef.current:', chartInstanceRef.current);
      console.log('selectedSensors.size:', selectedSensors.size);

      if (!chartInstanceRef.current || selectedSensors.size === 0) {
        console.log('TimeSeriesChart: Clearing chart or no sensors selected');
        // Clear chart if no sensors selected
        chartInstanceRef.current?.clear();
        return;
      }

      console.log('TimeSeriesChart: Updating chart with', selectedSensors.size, 'sensors');
      console.log('Files:', files.length);
      console.log('Selected sensors:', Array.from(selectedSensors));

      // Transform data
      const { series, yAxisConfigs, startTimestamp } = transformToChartData(files, selectedSensors);

      console.log('Transformed series:', series.length);
      console.log('Y-axis configs:', yAxisConfigs.length);
      console.log('First series data points:', series[0]?.data?.length || 0);
      console.log('Start timestamp:', startTimestamp);

      // Create chart option
      const option = createChartOption(series, yAxisConfigs);

      console.log('Chart option created:', option);

      // Update chart
      chartInstanceRef.current.setOption(option, true);
      console.log('Chart updated successfully');
    } catch (error) {
      console.error('TimeSeriesChart: Error in update chart effect:', error);
    }
  }, [files, selectedSensors]);

  return (
    <div className="flex-1 flex flex-col p-4 relative overflow-hidden">
      {/* Chart Header */}
      <div className="mb-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-200">Time Series Chart</h2>
          <p className="text-sm text-gray-500">
            {selectedSensors.size} sensor{selectedSensors.size !== 1 ? 's' : ''} displayed
          </p>
        </div>
        {selectedSensors.size > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                chartInstanceRef.current?.dispatchAction({
                  type: 'restore',
                });
              }}
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center gap-1.5"
              title="Reset zoom"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset View
            </button>
          </div>
        )}
      </div>

      {/* Chart Container - Always render so ref is available */}
      <div ref={chartRef} className="flex-1 min-h-0" />

      {/* Empty State Overlay */}
      {selectedSensors.size === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
          <div className="text-center">
            <svg className="w-24 h-24 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-xl text-gray-500 mb-2">No sensors selected</p>
            <p className="text-sm text-gray-600">Select sensors from the left panel to visualize data</p>
          </div>
        </div>
      )}
    </div>
  );
}
