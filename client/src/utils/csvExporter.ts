/**
 * Universal Client-Side CSV Exporter
 * Encodes UTF-8 BOM so Excel opens non-ASCII characters and currency symbols cleanly.
 */
export interface CSVColumn<T = any> {
  header: string;
  accessor: keyof T | ((row: T) => string | number | null | undefined);
}

export function exportToCSV<T = any>(
  filename: string,
  columns: CSVColumn<T>[],
  data: T[]
) {
  if (!data || data.length === 0) {
    alert('No data available to export');
    return;
  }

  const headerRow = columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');

  const rows = data.map((row) => {
    return columns
      .map((col) => {
        let val: any;
        if (typeof col.accessor === 'function') {
          val = col.accessor(row);
        } else {
          val = row[col.accessor];
        }

        if (val === null || val === undefined) {
          val = '';
        }

        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(',');
  });

  const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
