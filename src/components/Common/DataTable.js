import React from 'react';

const joinClasses = (...classes) => classes.filter(Boolean).join(' ');

const resolveValue = (value, ...args) => (typeof value === 'function' ? value(...args) : value);

const resolveRowKey = (rowKey, row, index) => {
  if (typeof rowKey === 'function') {
    return rowKey(row, index);
  }

  if (typeof rowKey === 'string' && row?.[rowKey] !== undefined) {
    return row[rowKey];
  }

  return index;
};

const DataTable = ({
  columns = [],
  data = [],
  rowKey = 'id',
  isRTL = false,
  wrapperClassName = 'overflow-x-auto',
  tableClassName = 'min-w-full divide-y divide-gray-200',
  headClassName = 'bg-gray-50',
  bodyClassName = 'bg-white divide-y divide-gray-200',
  rowClassName = 'hover:bg-gray-50 transition-colors',
  headerCellClassName =
  'px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap',
  cellClassName = 'px-6 py-4 whitespace-nowrap'
}) => {
  const visibleColumns = columns.filter(Boolean).filter((column) => !column.hidden);

  return (
    <div className={wrapperClassName}>
      <table className={tableClassName}>
        <thead className={joinClasses(headClassName, isRTL ? 'text-right' : 'text-left')}>
          <tr>
            {visibleColumns.map((column, columnIndex) => (
              <th
                key={column.id || column.key || columnIndex}
                scope="col"
                className={joinClasses(
                  headerCellClassName,
                  resolveValue(column.headerClassName, column)
                )}
              >
                {resolveValue(column.header, column)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className={bodyClassName}>
          {data.map((row, rowIndex) => (
            <tr
              key={resolveRowKey(rowKey, row, rowIndex)}
              className={resolveValue(rowClassName, row, rowIndex)}
            >
              {visibleColumns.map((column, columnIndex) => (
                <td
                  key={column.id || column.key || columnIndex}
                  className={joinClasses(
                    cellClassName,
                    resolveValue(column.cellClassName, row, rowIndex, column)
                  )}
                >
                  {column.render ? column.render(row, rowIndex) : row?.[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;