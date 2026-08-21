import type { ReactNode } from 'react';
import './table.css';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

/** Lightweight data table (admin). Virtualization deferred until lists grow. */
export function DataTable<T>({ columns, rows, onRowClick, getKey }: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  getKey: (row: T) => string;
}) {
  return (
    <div className="av-table-wrap">
      <table className="av-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getKey(row)} className={onRowClick ? 'is-clickable' : ''} onClick={() => onRowClick?.(row)}>
              {columns.map((c) => <td key={c.key}>{c.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
