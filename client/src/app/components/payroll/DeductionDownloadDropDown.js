"use client";

import { useState, useEffect, useRef } from "react";
import { FiDownload, FiSettings, FiChevronDown } from 'react-icons/fi';
import { generateCSV } from '../utils/deductions-download/generateCSV';
import { generatePDF } from '../utils/deductions-download/generatePDF';
import { getFormattedTableData } from '../utils/deductions-download/DeductionsFormattedData';

export default function DownloadDropdown({ employees, deductionTypes, onCustomizeClick }) {
  const [showMenu, setShowMenu] = useState(false);
  const dropdownRef = useRef(null);
  const settingsRef = useRef(null);

  const handleDownload = (type) => {
    const data = getFormattedTableData(employees, deductionTypes);
    if (type === 'csv') {
      generateCSV(data, 'deductions');
    } else if (type === 'pdf') {
      generatePDF(data, 'deductions');
    }
    setShowMenu(false);
  };

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          !settingsRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Customize Columns Button */}
      <div className="relative group" ref={settingsRef}>
        <button
          onClick={onCustomizeClick}
          className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-100"
          aria-label="Customize columns"
        >
          <FiSettings className="w-5 h-5" />
        </button>
        <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 bottom-full left-1/2 transform -translate-x-1/2 mb-1">
          Customize Columns
        </div>
      </div>

      {/* Download Dropdown */}
      <div className="relative group" ref={dropdownRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-100 transition-colors flex items-center gap-1"
          aria-label="Download"
        >
          <FiDownload className="w-5 h-5" />
        </button>
        <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 bottom-full left-1/2 transform -translate-x-1/2 mb-1">
          Download
        </div>
        {showMenu && (
          <div className="absolute right-0 z-10 mt-2 w-32 bg-white border border-gray-300 rounded shadow-lg">
            <button
              onClick={() => handleDownload('csv')}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              CSV
            </button>
            <button
              onClick={() => handleDownload('pdf')}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}