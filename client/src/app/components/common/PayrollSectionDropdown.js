'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function PayrollSectionDropdown({ current }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef(null);

  const options = [
    { label: 'Gross Pay', route: '/authenticated/payroll-data' },
    { label: 'Other Deductions', route: '/authenticated/payroll-data/deductions-management' },
    { label: 'Statutory Deductions', route: '/authenticated/payroll-data/statutory-management' },
  ];

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="px-4 py-2 bg-gray-100 text-black font-medium border rounded hover:bg-gray-200 flex items-center gap-2"
          aria-expanded={open}
          aria-haspopup="true"
        >
          {current}
          <span className="text-xs">▼</span>
        </button>
      </div>
      {open && (
        <div className="absolute z-10 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            {options
              .filter((opt) => opt.label !== current)
              .map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    router.push(opt.route);
                    setOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  {opt.label}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

