import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Loader2, Search, ChevronLeft, ChevronRight, Layers } from 'lucide-react';

const ExcelViewer = ({ blobUrl }) => {
  const [sheets, setSheets] = useState({});
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheet, setActiveSheet] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  useEffect(() => {
    let isMounted = true;

    const parseExcel = async () => {
      if (!blobUrl) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(blobUrl);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        if (!isMounted) return;

        const names = workbook.SheetNames || [];
        const parsedSheets = {};

        names.forEach((name) => {
          const worksheet = workbook.Sheets[name];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          parsedSheets[name] = jsonData;
        });

        setSheetNames(names);
        setSheets(parsedSheets);
        if (names.length > 0) {
          setActiveSheet(names[0]);
        }
      } catch (err) {
        console.error('Failed to parse Excel file:', err);
        if (isMounted) setError('Unable to parse Excel file for preview.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    parseExcel();

    return () => {
      isMounted = false;
    };
  }, [blobUrl]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium">Parsing Excel preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-2">
        <FileSpreadsheet className="w-10 h-10 text-rose-400" />
        <p className="text-sm font-medium text-gray-700">{error}</p>
        <p className="text-xs text-gray-400">You can still download the file to view in Microsoft Excel.</p>
      </div>
    );
  }

  const rawRows = sheets[activeSheet] || [];
  const headerRow = rawRows[0] || [];
  const bodyRows = rawRows.slice(1) || [];

  const filteredBodyRows = bodyRows.filter((row) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return row.some((cell) => String(cell).toLowerCase().includes(term));
  });

  const totalPages = Math.max(1, Math.ceil(filteredBodyRows.length / rowsPerPage));
  const displayedRows = filteredBodyRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="flex flex-col bg-white rounded-xl overflow-hidden border border-gray-100">
      {/* Sheet Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
          <Layers className="w-4 h-4 text-gray-400 mr-1 shrink-0" />
          {sheetNames.map((name) => (
            <button
              key={name}
              onClick={() => {
                setActiveSheet(name);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                activeSheet === name
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="relative shrink-0">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search rows..."
            className="pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-44"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-gray-100 text-gray-700 font-semibold border-b border-gray-200 z-10">
            <tr>
              <th className="px-3 py-2.5 w-12 text-center text-gray-400 bg-gray-100/95 border-r border-gray-200">#</th>
              {headerRow.map((col, idx) => (
                <th key={idx} className="px-4 py-2.5 whitespace-nowrap bg-gray-100/95 border-r border-gray-200 last:border-r-0">
                  {col || `Col ${idx + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {displayedRows.length === 0 ? (
              <tr>
                <td colSpan={Math.max(1, headerRow.length + 1)} className="text-center py-8 text-gray-400">
                  No matching data found
                </td>
              </tr>
            ) : (
              displayedRows.map((row, rIdx) => {
                const globalRowNumber = (currentPage - 1) * rowsPerPage + rIdx + 1;
                return (
                  <tr key={rIdx} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-3 py-2 text-center text-gray-400 bg-gray-50/50 font-mono text-[11px] border-r border-gray-100">
                      {globalRowNumber}
                    </td>
                    {headerRow.map((_, cIdx) => (
                      <td key={cIdx} className="px-4 py-2 whitespace-nowrap border-r border-gray-100 last:border-r-0">
                        {row[cIdx] !== undefined && row[cIdx] !== null ? String(row[cIdx]) : '-'}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredBodyRows.length > rowsPerPage && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500">
          <span>
            Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
            {Math.min(currentPage * rowsPerPage, filteredBodyRows.length)} of {filteredBodyRows.length} rows
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-gray-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelViewer;
