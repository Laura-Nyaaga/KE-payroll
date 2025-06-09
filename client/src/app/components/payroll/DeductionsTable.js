"use client"; 

export default function DeductionsTable({ employees, onEditDeduction, visibleColumns, deductionTypes }) {
  const formatCurrency = (value) =>
    parseFloat(value).toLocaleString("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="overflow-x-auto max-w-full">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {visibleColumns?.staffNo && (
              <th className="border px-6 py-3 text-left text-xs font-bold tracking-wider">Staff ID</th>
            )}
            {visibleColumns?.name && (
              <th className="border px-6 py-3 text-left text-xs font-bold tracking-wider">Employee Names</th>
            )}
            {deductionTypes?.map((type) =>
              visibleColumns[type] ? (
                <th
                  key={type}
                  className="border px-6 py-3 text-left text-xs font-bold tracking-wider"
                >
                  {type}
                </th>
              ) : null
            )}
            {visibleColumns?.total && (
              <th className="border px-6 py-3 text-left text-xs font-bold tracking-wider">Total</th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {employees.map((employee) => {
            const totalDeductions = employee.employeeDeductions.reduce((sum, d) => {
              const amount = d.calculatedAmount || d.customMonthlyAmount || 0;
              return sum + parseFloat(amount);
            }, 0);

            return (
              <tr 
              key={employee.id} 
              className="even:bg-gray-100 odd:bg-gray-50 hover:bg-gray-200 transition"
              >
                {visibleColumns?.staffNo && (
                  <td className="border px-6 py-4 text-sm font-bold whitespace-nowrap">
                    {employee.staffNo}
                  </td>
                )}
                {visibleColumns?.name && (
                  <td className="border px-6 py-4 text-sm font-medium whitespace-nowrap">
                    {employee.firstName} {employee.lastName}
                  </td>
                )}
                {deductionTypes?.map((type) => {
                  const deduction = employee.employeeDeductions.find(
                    (d) => d.deduction.deductionType === type
                  );
                  const amount = deduction ? (deduction.calculatedAmount || deduction.customMonthlyAmount || 0) : 0;

                  return visibleColumns[type] ? (
                    <td
                      key={type}
                      className={`border px-6 py-4 text-sm whitespace-nowrap ${
                        deduction ? 'cursor-pointer hover:underline' : 'text-gray-500'
                      }`}
                      onClick={() => {
                        if (deduction) {
                          onEditDeduction(deduction, employee);
                        }
                      }}
                    >
                      {formatCurrency(amount)}
                    </td>
                  ) : null;
                })}
                {visibleColumns?.total && (
                  <td className="border px-6 py-4 text-sm font-bold whitespace-nowrap">
                    {formatCurrency(totalDeductions)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

