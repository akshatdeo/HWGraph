import type { LoadedFile, Sensor, DataPoint } from '../types';
import type { EChartsOption } from 'echarts';

export interface ChartSeries {
  name: string;
  data: [number, number | null][];
  type: 'line';
  yAxisIndex: number;
  color: string;
  unit: string;
  fileId: string;
  sensorId: string;
  smooth: boolean;
  symbol: 'none';
  sampling: 'lttb'; // Largest-Triangle-Three-Buckets downsampling
}

export interface YAxisConfig {
  unit: string;
  min?: number;
  max?: number;
  name: string;
  position: 'left' | 'right';
  offset: number;
}

/**
 * Color palette for chart lines
 */
const COLOR_PALETTE = [
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
  '#84cc16', // lime
  '#f43f5e', // rose
];

/**
 * Get color for a sensor based on its index
 */
export function getSensorColor(index: number): string {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

/**
 * Find sensor in loaded files by IDs
 */
function findSensor(files: LoadedFile[], fileId: string, sensorId: string): { file: LoadedFile; sensor: Sensor } | null {
  const file = files.find(f => f.id === fileId);
  if (!file) return null;

  for (const category of file.categories) {
    const sensor = category.sensors.find(s => s.id === sensorId);
    if (sensor) {
      return { file, sensor };
    }
  }
  return null;
}

/**
 * Get data points for a specific sensor
 */
function getSensorData(file: LoadedFile, sensor: Sensor): DataPoint[] {
  const data = file.rawData.get(sensor.columnIndex);
  console.log(`Getting data for sensor ${sensor.name} (column ${sensor.columnIndex}):`, data?.length || 0, 'points');
  console.log('Available columns in rawData:', Array.from(file.rawData.keys()));
  return data || [];
}

/**
 * Transform selected sensors into ECharts series format
 */
export function transformToChartData(
  files: LoadedFile[],
  selectedSensorKeys: Set<string>
): { series: ChartSeries[]; yAxisConfigs: YAxisConfig[] } {
  console.log('transformToChartData called with:', files.length, 'files and', selectedSensorKeys.size, 'selected sensors');

  const seriesList: ChartSeries[] = [];
  const unitToAxisIndex = new Map<string, number>();
  const yAxisConfigs: YAxisConfig[] = [];

  // Convert selected sensor keys to array and sort for consistent coloring
  const selectedArray = Array.from(selectedSensorKeys).sort();
  console.log('Selected sensor keys:', selectedArray);

  selectedArray.forEach((key, index) => {
    const [fileId, sensorId] = key.split(':');
    const result = findSensor(files, fileId, sensorId);

    if (!result) return;

    const { file, sensor } = result;
    const dataPoints = getSensorData(file, sensor);

    // Determine Y-axis index based on unit
    let yAxisIndex = unitToAxisIndex.get(sensor.unit);
    if (yAxisIndex === undefined) {
      yAxisIndex = yAxisConfigs.length;
      unitToAxisIndex.set(sensor.unit, yAxisIndex);

      // Create Y-axis config
      const position: 'left' | 'right' = yAxisIndex % 2 === 0 ? 'left' : 'right';
      const offset = Math.floor(yAxisIndex / 2) * 60; // Stack axes with 60px offset

      yAxisConfigs.push({
        unit: sensor.unit,
        name: sensor.unit,
        position,
        offset,
      });
    }

    // Transform data points to [timestamp, value] format
    const chartData: [number, number | null][] = dataPoints.map(dp => [dp.timestamp, dp.value]);

    // Create series name (include filename if multiple files)
    const seriesName = files.length > 1
      ? `${file.filename} - ${sensor.name}`
      : sensor.name;

    seriesList.push({
      name: seriesName,
      data: chartData,
      type: 'line',
      yAxisIndex,
      color: getSensorColor(index),
      unit: sensor.unit,
      fileId: file.id,
      sensorId: sensor.id,
      smooth: false, // Can be made configurable
      symbol: 'none', // Don't show dots on each point
      sampling: 'lttb', // Use downsampling for performance
    });
  });

  return { series: seriesList, yAxisConfigs };
}

/**
 * Create ECharts option configuration
 */
export function createChartOption(
  series: ChartSeries[],
  yAxisConfigs: YAxisConfig[]
): EChartsOption {
  return {
    backgroundColor: 'transparent',
    grid: {
      left: 60 + (Math.floor(yAxisConfigs.filter(a => a.position === 'left').length / 1) * 60),
      right: 60 + (Math.floor(yAxisConfigs.filter(a => a.position === 'right').length / 1) * 60),
      top: 60,
      bottom: 80,
      containLabel: false,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      borderColor: '#374151',
      borderWidth: 1,
      textStyle: {
        color: '#e5e7eb',
        fontSize: 12,
      },
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#374151',
        },
      },
      formatter: (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return '';

        const timestamp = params[0].value[0];
        const date = new Date(timestamp);
        let tooltip = `<div style="font-weight: 600; margin-bottom: 8px;">${date.toLocaleString()}</div>`;

        params.forEach((param: any) => {
          const value = param.value[1];
          const valueStr = value !== null ? value.toFixed(3) : 'N/A';
          const series = param.seriesName;
          const color = param.color;

          tooltip += `
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; background-color: ${color}; border-radius: 50%; margin-right: 8px;"></span>
              <span style="flex: 1;">${series}:</span>
              <span style="font-weight: 600; margin-left: 12px;">${valueStr}</span>
            </div>
          `;
        });

        return tooltip;
      },
    },
    legend: {
      type: 'scroll',
      bottom: 10,
      textStyle: {
        color: '#9ca3af',
      },
      pageTextStyle: {
        color: '#9ca3af',
      },
      pageIconColor: '#3b82f6',
      pageIconInactiveColor: '#4b5563',
    },
    xAxis: {
      type: 'time',
      axisLine: {
        lineStyle: {
          color: '#4b5563',
        },
      },
      axisLabel: {
        color: '#9ca3af',
        formatter: (value: number) => {
          const date = new Date(value);
          return date.toLocaleTimeString();
        },
      },
      splitLine: {
        lineStyle: {
          color: '#374151',
          type: 'dashed',
        },
      },
    },
    yAxis: yAxisConfigs.map((config, index) => ({
      type: 'value',
      name: config.name,
      position: config.position,
      offset: config.offset,
      nameTextStyle: {
        color: '#9ca3af',
        fontSize: 12,
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#4b5563',
        },
      },
      axisLabel: {
        color: '#9ca3af',
        formatter: (value: number) => {
          // Format large numbers
          if (Math.abs(value) >= 1000) {
            return (value / 1000).toFixed(1) + 'k';
          }
          return value.toFixed(1);
        },
      },
      splitLine: {
        show: index === 0, // Only show grid lines for first axis
        lineStyle: {
          color: '#374151',
          type: 'dashed',
        },
      },
    })),
    series: series.map(s => ({
      name: s.name,
      type: s.type,
      data: s.data,
      yAxisIndex: s.yAxisIndex,
      color: s.color,
      smooth: s.smooth,
      symbol: s.symbol,
      sampling: s.sampling,
      lineStyle: {
        width: 2,
      },
      emphasis: {
        focus: 'series',
        lineStyle: {
          width: 3,
        },
      },
    })),
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'none',
      },
      {
        type: 'slider',
        xAxisIndex: 0,
        filterMode: 'none',
        height: 30,
        bottom: 50,
        borderColor: '#4b5563',
        fillerColor: 'rgba(59, 130, 246, 0.2)',
        handleStyle: {
          color: '#3b82f6',
        },
        moveHandleStyle: {
          color: '#3b82f6',
        },
        textStyle: {
          color: '#9ca3af',
        },
      },
    ],
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: 'none',
        },
        restore: {},
        saveAsImage: {
          backgroundColor: '#111827',
          pixelRatio: 2,
        },
      },
      iconStyle: {
        borderColor: '#9ca3af',
      },
      emphasis: {
        iconStyle: {
          borderColor: '#3b82f6',
        },
      },
    },
  };
}
