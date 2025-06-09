'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PayrollSectionDropdown({ current }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const options = [
    { label: 'Earnings', route: '/authenticated/payroll-Data/earnings-management' },
    { label: 'Deductions', route: '/authenticated/payroll-Data' },
    { label: 'Taxes', route: '/authenticated/payroll-Data/statutory-management' },
  ];

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="px-4 py-2 bg-gray-100 text-black font-medium border rounded hover:bg-gray-200"
        >
          {current} ▼
        </button>
      </div>
      {open && (
        <div className="absolute z-10 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          {options
            .filter((opt) => opt.label !== current)
            .map((opt) => (
              <button
                key={opt.label}
                onClick={() => router.push(opt.route)}
                className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
              >
                {opt.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
