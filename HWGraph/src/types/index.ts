export interface SensorCategory {
  id: string;
  name: string;           // e.g., "CPU [#0]: Intel Core i7-12700K"
  sensors: Sensor[];
}

export interface Sensor {
  id: string;
  categoryId: string;
  name: string;           // e.g., "CPU Package"
  unit: string;           // e.g., "°C"
  columnIndex: number;    // Position in CSV
}

export interface DataPoint {
  timestamp: number;      // Unix milliseconds
  value: number | null;   // null for invalid/missing
}

export interface SensorData {
  sensor: Sensor;
  data: DataPoint[];
  stats: SensorStats;
}

export interface SensorStats {
  min: number;
  max: number;
  avg: number;
  percentile95: number;
  percentile99: number;
  validCount: number;
  invalidCount: number;
}

export interface LoadedFile {
  id: string;
  filename: string;
  filepath: string;
  loadedAt: Date;
  startTime: Date;
  endTime: Date;
  duration: number;       // milliseconds
  sampleCount: number;
  categories: SensorCategory[];
  rawData: Map<number, DataPoint[]>; // columnIndex -> data points
  metrics: ParseMetrics;
}

export interface ChartSeries {
  fileId: string;
  sensorId: string;
  color: string;
  visible: boolean;
  yAxisId: string;
}

export interface AppState {
  files: LoadedFile[];
  selectedSensors: string[];    // sensor IDs
  chartSeries: ChartSeries[];
  timeRange: [number, number];  // visible range
  comparisonMode: boolean;
  theme: 'dark' | 'light';
}

export interface ParseWarning {
  type: 'info' | 'warning' | 'error';
  message: string;
}

export interface ParseMetrics {
  totalColumns: number;
  totalSensors: number;
  totalCategories: number;
  totalSamples: number;
  totalDataPoints: number;
  nullValueCount: number;
  dataCompleteness: number;     // percentage (0-100)
  warnings: ParseWarning[];
}
