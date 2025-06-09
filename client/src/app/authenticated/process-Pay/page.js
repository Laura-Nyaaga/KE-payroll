'use client';

// import { PayrollProvider } from '../components/payroll/context/PayrollContext';
import { PayrollProvider } from '@/app/components/payroll/context/PayrollContext';
import PayrollTable from '@/app/components/payroll/table/PayrollTable';

// import PayrollTable from '../components/payroll/table/PayrollTable';

export default function PayrollManagementPage() {
  return (
    <PayrollProvider>
      <div className="p-4 text-black">
        <h1 className="text-2xl font-bold mb-4">Payroll Management</h1>
        <PayrollTable />
      </div>
    </PayrollProvider>
  );
}