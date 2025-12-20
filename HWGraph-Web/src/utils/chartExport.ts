import type { ECharts } from 'echarts';

export async function exportChartAsPNG(
  chart: ECharts,
  filename: string = 'hwgraph-chart.png',
  pixelRatio: number = 2
): Promise<void> {
  const url = chart.getDataURL({
    type: 'png',
    pixelRatio,
    backgroundColor: '#111827'
  });
  downloadImage(url, filename);
}

export async function exportChartAsSVG(
  chart: ECharts,
  filename: string = 'hwgraph-chart.svg'
): Promise<void> {
  const url = chart.getDataURL({
    type: 'svg',
    backgroundColor: '#111827'
  });
  downloadImage(url, filename);
}

function downloadImage(dataURL: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = filename;
  link.click();
}

export async function exportToCSV(
  series: any[],
  filename: string = 'hwgraph-export.csv'
): Promise<void> {
  let csv = 'Time (s)';

  series.forEach(s => {
    csv += ',' + s.name;
  });
  csv += '\n';

  const maxLength = Math.max(...series.map(s => s.data.length));

  for (let i = 0; i < maxLength; i++) {
    const time = series[0]?.data[i]?.[0] || i;
    csv += time;

    series.forEach(s => {
      const value = s.data[i]?.[1];
      csv += ',' + (value !== null && value !== undefined ? value : '');
    });

    csv += '\n';
  }

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
