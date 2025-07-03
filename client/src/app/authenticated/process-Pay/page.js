'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { PayrollProvider } from '@/app/components/payroll/context/PayrollContext';
import PayrollTable from '@/app/components/payroll/table/PayrollTable';


export default function PayrollManagementPage() {
  return (
    <PayrollProvider>
      <Suspense fallback={<div>Loading payroll...</div>}>
        <div className="p-4 text-black">
          <h1 className="text-2xl font-bold mb-4">Payroll Management</h1>
          <PayrollTable />
        </div>
      </Suspense>
    </PayrollProvider>
  );
}