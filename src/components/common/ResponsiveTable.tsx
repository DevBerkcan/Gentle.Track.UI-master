// src/components/common/ResponsiveTable.tsx
import './ResponsiveTable.css';

interface Column {
  header: string;
  accessor: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  keyField: string;
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({ columns, data, keyField }) => {
  return (
    <div className="responsive-table-container">
      <table className="table responsive-table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row[keyField]}>
              {columns.map((column, index) => (
                <td key={index} data-label={column.header}>
                  {column.render ? column.render(row[column.accessor], row) : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResponsiveTable;