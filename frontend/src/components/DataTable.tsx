import React from 'react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  render?: (row: T, index: number) => React.ReactNode;
}

export type Column<T> = ColumnDef<T>;

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isRowHighlighted?: (row: T) => boolean;
  isDeployed?: (row: T) => boolean;
  highlightLabel?: string;
  keyExtractor?: (row: T, index: number) => string | number;
  keyField?: string;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isRowHighlighted,
  isDeployed,
  highlightLabel = 'DEPLOYED',
  keyExtractor,
  keyField,
  emptyMessage = 'No data available in this table.',
  className = '',
}: DataTableProps<T>) {
  const checkHighlight = isRowHighlighted || isDeployed;
  const getKey = keyExtractor || ((row: any, idx: number) => (keyField && row[keyField] !== undefined ? row[keyField] : idx));
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center bg-white border border-hairline rounded-[8px]">
        <p className="font-caption text-ink-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-x-auto border border-hairline rounded-[8px] bg-white ${className}`}>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-hairline bg-paper/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-3 px-4 font-micro text-ink-faint tracking-wider ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left'
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {data.map((row, idx) => {
            const isHighlighted = checkHighlight ? checkHighlight(row) : false;
            return (
              <tr
                key={getKey(row, idx)}
                className={`transition-colors h-12 hover:bg-paper/80 ${
                  isHighlighted ? 'bg-violet/10 font-medium' : ''
                }`}
              >
                {columns.map((col) => {
                  const content = col.render ? col.render(row, idx) : row[col.key];
                  const isNumber = typeof row[col.key] === 'number';
                  const alignmentClass =
                    col.align === 'right' || (!col.align && isNumber)
                      ? 'text-right tabular-nums font-mono'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left';

                  return (
                    <td
                      key={col.key}
                      className={`py-3 px-4 font-body text-sm text-ink ${alignmentClass}`}
                    >
                      {col.key === columns[0].key && isHighlighted && highlightLabel ? (
                        <div className="flex items-center gap-2">
                          <span>{content}</span>
                          <span className="font-micro text-[10px] bg-indigo text-white px-1.5 py-0.5 rounded tracking-widest">
                            {highlightLabel}
                          </span>
                        </div>
                      ) : (
                        content
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
