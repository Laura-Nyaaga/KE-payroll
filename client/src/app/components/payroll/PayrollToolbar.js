import { useState, useEffect, useRef, forwardRef } from 'react'; // Import forwardRef
import { Download, Settings } from 'lucide-react';

// Define the functional component
function PayrollToolbar({ onExport, onCustomize, isCustomizerOpen }, ref) { // 'ref' is the forwarded ref
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const toolbarRef = useRef(null);
  const downloadRef = useRef(null);

  // Close download menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDownloadMenu && downloadRef.current && !downloadRef.current.contains(event.target)) {
        setShowDownloadMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDownloadMenu]);

  const handleCustomizeClick = (e) => {
    e.stopPropagation();
    onCustomize(); // This will toggle showCustomizer in PayrollTable
  };

  return (
    <div className="flex items-center gap-2 relative" ref={toolbarRef}>
      {/* Customize Columns Button */}
      <div className="relative group">
        <button
          onClick={handleCustomizeClick}
          className={`text-blue-600 p-2 rounded ${
            isCustomizerOpen ? 'bg-blue-100 text-blue-800' : 'hover:text-blue-800 hover:bg-blue-100'
          }`}
          aria-label="Customize columns"
          aria-expanded={isCustomizerOpen}
          ref={ref}
        >
          <Settings className="w-5 h-5" />
        </button>
        <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 bottom-full left-1/2 transform -translate-x-1/2 mb-1">
          Customize Columns
        </div>
      </div>

      {/* Download Button with Dropdown - no changes needed */}
      <div className="relative group" ref={downloadRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDownloadMenu(!showDownloadMenu);
          }}
          className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-100 transition-colors flex items-center gap-1"
          aria-label="Download"
        >
          <Download className="w-5 h-5" />           
        </button>
        <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 bottom-full left-1/2 transform -translate-x-1/2 mb-1">
          Download
        </div>
        {showDownloadMenu && (
          <div 
            className="absolute right-0 z-10 mt-2 w-32 bg-white border border-gray-300 rounded shadow-lg"
            onClick={(e) => e.stopPropagation()} 
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExport('csv');
                setShowDownloadMenu(false);
              }}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              CSV
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExport('pdf');
                setShowDownloadMenu(false);
              }}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              PDF
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExport('payslip');
                setShowDownloadMenu(false);
              }}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              Payslip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default forwardRef(PayrollToolbar);

























