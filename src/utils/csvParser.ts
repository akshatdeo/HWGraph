import Papa from 'papaparse';
import type { LoadedFile, SensorCategory, Sensor, DataPoint, ParseWarning, ParseMetrics } from '../types';

interface ParseResult {
  success: boolean;
  data?: LoadedFile;
  error?: string;
}

interface SensorMetadata {
  columnIndex: number;
  category: string;
  sensorName: string;
  unit: string;
}

/**
 * Parse HWiNFO CSV format
 * Header format: "Date/Time" followed by columns like "CPU [#0]: Intel Core,Core #0 Temperature,°C"
 */
export function parseHWiNFOCSV(
  csvContent: string,
  filepath: string,
  filename: string
): ParseResult {
  try {
    // Parse CSV
    const parseResult = Papa.parse(csvContent, {
      skipEmptyLines: true,
    });

    if (parseResult.errors.length > 0) {
      console.error('CSV parse errors:', parseResult.errors);
      return {
        success: false,
        error: 'Failed to parse CSV: ' + parseResult.errors[0].message,
      };
    }

    const rows = parseResult.data as string[][];

    if (rows.length < 2) {
      return {
        success: false,
        error: 'CSV file is empty or has insufficient data',
      };
    }

    // Check if last row is a category row (HWiNFO multi-row header format)
    // Category row starts with empty columns (Date, Time) and contains hardware/category names
    const lastRow = rows[rows.length - 1];
    const hasCategoryRow = lastRow[0].trim() === '' && lastRow[1].trim() === '' && lastRow.length > 2;

    console.log('Has category row:', hasCategoryRow);

    // Parse headers
    const headerRow = rows[0];
    console.log('First row (headers):', headerRow);
    console.log('First 5 headers:', headerRow.slice(0, 5));

    const categoryRow = hasCategoryRow ? lastRow : undefined;
    const sensorMetadata = parseHeaders(headerRow, categoryRow);
    console.log('Parsed sensor metadata:', sensorMetadata.length, 'sensors');
    console.log('First 3 sensors:', sensorMetadata.slice(0, 3));

    if (sensorMetadata.length === 0) {
      console.error('Header row:', headerRow);
      return {
        success: false,
        error: 'No valid sensors found in CSV headers. First header: "' + headerRow[0] + '"',
      };
    }

    // Parse data rows (exclude category row if present)
    const dataRows = hasCategoryRow ? rows.slice(1, -1) : rows.slice(1);
    const {
      dataPoints,
      startTime,
      endTime,
      nullValueCount,
      totalDataPoints,
      invalidTimestampCount
    } = parseDataRows(dataRows, sensorMetadata);

    // Build sensor hierarchy
    const categories = buildSensorHierarchy(sensorMetadata);

    // Build warnings array
    const warnings: ParseWarning[] = [];

    if (invalidTimestampCount > 0) {
      warnings.push({
        type: 'warning',
        message: `${invalidTimestampCount} rows skipped due to invalid timestamps`
      });
    }

    const dataCompleteness = totalDataPoints > 0
      ? ((totalDataPoints - nullValueCount) / totalDataPoints * 100)
      : 100;

    if (dataCompleteness < 95) {
      warnings.push({
        type: 'warning',
        message: `Data completeness is ${dataCompleteness.toFixed(1)}% (${nullValueCount} null values found)`
      });
    } else if (nullValueCount > 0) {
      warnings.push({
        type: 'info',
        message: `${nullValueCount} null values found in data (${dataCompleteness.toFixed(1)}% complete)`
      });
    }

    // Build metrics
    const metrics: ParseMetrics = {
      totalColumns: headerRow.length,
      totalSensors: sensorMetadata.length,
      totalCategories: categories.length,
      totalSamples: dataRows.length,
      totalDataPoints,
      nullValueCount,
      dataCompleteness,
      warnings
    };

    // Create LoadedFile object
    const loadedFile: LoadedFile = {
      id: crypto.randomUUID(),
      filename,
      filepath,
      loadedAt: new Date(),
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      sampleCount: dataRows.length,
      categories,
      rawData: dataPoints,
      metrics
    };

    return {
      success: true,
      data: loadedFile,
    };
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Parse header row to extract sensor metadata
 * Format: "Sensor Name [Unit]"
 * Examples: "CPU (Tctl/Tdie) [°C]", "Core 0 VID [V]", "Total CPU Usage [%]"
 *
 * @param headerRow - Row containing sensor names with units
 * @param categoryRow - Optional last row containing hardware/category groupings
 */
function parseHeaders(headerRow: string[], categoryRow?: string[]): SensorMetadata[] {
  const metadata: SensorMetadata[] = [];

  // Skip first two columns (Date and Time)
  for (let i = 2; i < headerRow.length; i++) {
    const header = headerRow[i];

    if (!header || header.trim() === '') {
      continue;
    }

    // Parse "Sensor Name [Unit]" format
    const match = header.match(/^(.+?)\s*\[([^\]]*)\]$/);

    if (match) {
      const sensorName = match[1].trim();
      const unit = match[2].trim();

      // Use category from category row if available, otherwise extract from sensor name
      let category: string;
      if (categoryRow && i < categoryRow.length && categoryRow[i] && categoryRow[i].trim() !== '') {
        category = categoryRow[i].trim();
      } else {
        category = extractCategory(sensorName);
      }

      metadata.push({
        columnIndex: i,
        category,
        sensorName,
        unit,
      });
    } else {
      // Header without unit (might be empty or malformed)
      if (header.trim() !== '') {
        let category: string;
        if (categoryRow && i < categoryRow.length && categoryRow[i] && categoryRow[i].trim() !== '') {
          category = categoryRow[i].trim();
        } else {
          category = extractCategory(header);
        }

        metadata.push({
          columnIndex: i,
          category,
          sensorName: header.trim(),
          unit: '',
        });
      }
    }
  }

  return metadata;
}

/**
 * Extract category from sensor name
 * Examples:
 * - "CPU (Tctl/Tdie)" -> "CPU"
 * - "Core 0 VID" -> "CPU Cores"
 * - "GPU Temperature" -> "GPU"
 * - "Virtual Memory Committed" -> "System Memory"
 */
function extractCategory(sensorName: string): string {
  const name = sensorName.toLowerCase();

  // CPU related
  if (name.includes('cpu') && !name.includes('gpu')) {
    return 'CPU';
  }
  if (name.startsWith('core ') || name.includes('core temperatures') || name.includes('core clocks')) {
    return 'CPU Cores';
  }

  // GPU related
  if (name.includes('gpu')) {
    return 'GPU';
  }

  // Memory related
  if (name.includes('memory') || name.includes('dram')) {
    return 'Memory';
  }

  // Storage/Drive
  if (name.includes('drive') || name.includes('host writes') || name.includes('host reads')) {
    return 'Storage';
  }

  // Power
  if (name.includes('power') && !name.includes('gpu')) {
    return 'Power';
  }

  // Temperature
  if (name.includes('temperature') && !name.includes('gpu') && !name.includes('cpu')) {
    return 'Temperatures';
  }

  // Framerate/Performance
  if (name.includes('framerate') || name.includes('frame time') || name.includes('fps')) {
    return 'Gaming Performance';
  }

  // Network
  if (name.includes('dl rate') || name.includes('up rate') || name.includes('total dl') || name.includes('total up')) {
    return 'Network';
  }

  // Battery
  if (name.includes('battery') || name.includes('charge')) {
    return 'Battery';
  }

  // Fans
  if (name.includes('rpm') || name.includes('fan')) {
    return 'Cooling';
  }

  // PCIe
  if (name.includes('pcie') || name.includes('pci express')) {
    return 'PCIe';
  }

  // Default: System
  return 'System';
}

/**
 * Parse data rows and extract timestamps and values
 */
function parseDataRows(
  rows: string[][],
  sensorMetadata: SensorMetadata[]
): {
  dataPoints: Map<number, DataPoint[]>;
  startTime: Date;
  endTime: Date;
  nullValueCount: number;
  totalDataPoints: number;
  invalidTimestampCount: number;
} {
  const dataPoints = new Map<number, DataPoint[]>();

  // Initialize arrays for each sensor
  sensorMetadata.forEach((sensor) => {
    dataPoints.set(sensor.columnIndex, []);
  });

  let startTime: Date | null = null;
  let endTime: Date | null = null;
  let nullValueCount = 0;
  let totalDataPoints = 0;
  let invalidTimestampCount = 0;

  rows.forEach((row) => {
    if (row.length < 3) return; // Need at least Date, Time, and one data column

    // Parse timestamp (first two columns: Date and Time)
    const dateStr = row[0];
    const timeStr = row[1];
    const timestamp = parseTimestamp(dateStr, timeStr);

    if (!timestamp) {
      console.warn('Invalid timestamp:', dateStr, timeStr);
      invalidTimestampCount++;
      return;
    }

    // Track start and end times
    if (!startTime || timestamp < startTime) {
      startTime = timestamp;
    }
    if (!endTime || timestamp > endTime) {
      endTime = timestamp;
    }

    // Parse sensor values
    sensorMetadata.forEach((sensor) => {
      const valueStr = row[sensor.columnIndex];
      const value = parseValue(valueStr);

      totalDataPoints++;
      if (value === null) {
        nullValueCount++;
      }

      dataPoints.get(sensor.columnIndex)?.push({
        timestamp: timestamp.getTime(),
        value,
      });
    });
  });

  return {
    dataPoints,
    startTime: startTime || new Date(),
    endTime: endTime || new Date(),
    nullValueCount,
    totalDataPoints,
    invalidTimestampCount,
  };
}

/**
 * Parse timestamp from separate date and time strings
 * HWiNFO format:
 * - Date: DD.MM.YYYY (e.g., "16.12.2025")
 * - Time: HH:MM:SS.mmm (e.g., "23:24:37.584")
 */
function parseTimestamp(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr || dateStr.trim() === '' || timeStr.trim() === '') {
    return null;
  }

  try {
    // Parse date: DD.MM.YYYY
    const dateParts = dateStr.trim().split('.');
    if (dateParts.length !== 3) {
      return null;
    }

    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // JavaScript months are 0-indexed
    const year = parseInt(dateParts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return null;
    }

    // Parse time: HH:MM:SS.mmm
    const timeParts = timeStr.trim().split(':');
    if (timeParts.length !== 3) {
      return null;
    }

    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    const secondsParts = timeParts[2].split('.');
    const seconds = parseInt(secondsParts[0], 10);
    const milliseconds = secondsParts.length > 1 ? parseInt(secondsParts[1].padEnd(3, '0').substring(0, 3), 10) : 0;

    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || isNaN(milliseconds)) {
      return null;
    }

    // Create timestamp by combining date and time
    const timestamp = new Date(year, month, day, hours, minutes, seconds, milliseconds);

    if (isNaN(timestamp.getTime())) {
      return null;
    }

    return timestamp;
  } catch (error) {
    console.error('Error parsing timestamp:', error, 'dateStr:', dateStr, 'timeStr:', timeStr);
    return null;
  }
}

/**
 * Parse sensor value (handle empty/invalid values)
 */
function parseValue(valueStr: string): number | null {
  if (!valueStr || valueStr.trim() === '') {
    return null;
  }

  const value = parseFloat(valueStr);

  if (isNaN(value)) {
    return null;
  }

  return value;
}

/**
 * Build sensor hierarchy: group sensors by category
 */
function buildSensorHierarchy(metadata: SensorMetadata[]): SensorCategory[] {
  const categoryMap = new Map<string, Sensor[]>();

  // Group sensors by category
  metadata.forEach((meta) => {
    if (!categoryMap.has(meta.category)) {
      categoryMap.set(meta.category, []);
    }

    const sensor: Sensor = {
      id: `sensor-${meta.columnIndex}`,
      categoryId: `category-${meta.category}`,
      name: meta.sensorName,
      unit: meta.unit,
      columnIndex: meta.columnIndex,
    };

    categoryMap.get(meta.category)!.push(sensor);
  });

  // Convert to SensorCategory array
  const categories: SensorCategory[] = [];

  categoryMap.forEach((sensors, categoryName) => {
    categories.push({
      id: `category-${categoryName}`,
      name: categoryName,
      sensors,
    });
  });

  return categories;
}
