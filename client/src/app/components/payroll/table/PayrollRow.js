import PayrollStatusBadge from '../status/PayrollStatusBadge';
import { formatCurrency } from '../../utils/formatPayrollData';

export default function PayrollRow({ employee, earningsTypes, deductionsTypes, selected, onSelect, visibleColumns }) {
  // Safeguard against undefined statutory values
  const statutory = employee.statutory || {
    nssf: 0,
    shif: 0,
    housingLevy: 0,
    paye: 0,
    total: 0
  };

  return (
    <tr className="hover:bg-gray-100 even:bg-gray-50">
      <td className="border px-4 py-2 text-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="accent-blue-500"
        />
      </td>

      {visibleColumns.staffId && (
        <td className="border px-4 py-2">{employee.staffId}</td>
      )}

      {visibleColumns.fullName && (
        <td className="border px-4 py-2">{employee.fullName}</td>
      )}

      {visibleColumns.basicSalary && (
        <td className="border px-4 py-2">
          {formatCurrency(employee.basicSalary || 0)}
        </td>
      )}

      {/* Earnings - Fixed to handle empty arrays */}
      {earningsTypes.map((type) => {
        const key = `earning_${type}`;
        if (!visibleColumns[key]) return null;
        
        const earning = (employee.earnings || []).find(e => e.name === type); // Changed from 'type' to 'name'
        return (
          <td key={key} className="border px-4 py-2">
            {earning ? formatCurrency(earning.amount) : '0.00'}
          </td>
        );
      })}

    

      {/* {visibleColumns.totalEarnings && (
        <td className="border px-4 py-2">
          {formatCurrency(employee.totalEarnings || 0)}
        </td>
      )} */}


       {visibleColumns.grossPay && (
        <td className="border px-4 py-2">
          {formatCurrency(employee.grossPay || 0)}
        </td>
      )}

       {visibleColumns.paye && (
        <td className="border px-4 py-2">
          {formatCurrency(statutory.paye)}
        </td>
      )}

      {visibleColumns.nssf && (
        <td className="border px-4 py-2">
          {formatCurrency(statutory.nssf)}
        </td>
      )}

      {visibleColumns.shif && (
        <td className="border px-4 py-2">
          {formatCurrency(statutory.shif)}
        </td>
      )}

      {visibleColumns.housingLevy && (
        <td className="border px-4 py-2">
          {formatCurrency(statutory.housingLevy)}
        </td>
      )}

      {visibleColumns.totalStatutory && (
        <td className="border px-4 py-2">
          {formatCurrency(statutory.total)}
        </td>
      )}
      
        {/* Deductions - Fixed to handle empty arrays */}
      {deductionsTypes.map((type) => {
        const key = `deduction_${type}`;
        if (!visibleColumns[key]) return null;
        
        const deduction = (employee.deductions || []).find(d => d.name === type); // Changed from 'type' to 'name'
        return (
          <td key={key} className="border px-4 py-2">
            {deduction ? formatCurrency(deduction.amount) : '0.00'}
          </td>
        );
      })}

         {visibleColumns.totalDeductions && (
        <td className="border px-4 py-2">
          {formatCurrency(employee.totalDeductions || 0)}
        </td>
      )}

      {visibleColumns.netPay && (
        <td className="border px-4 py-2">
          {formatCurrency(employee.netPay || 0)}
        </td>
      )}

     {visibleColumns.paymentMethod && (
        <td className="border px-4 py-2">
          { employee.paymentMethod } 
        </td>
      )}

      {visibleColumns.status && (
        <td className="border px-4 py-2">
          <PayrollStatusBadge status={employee.status || 'draft'} />
        </td>
      )}
    </tr>
  );
}









