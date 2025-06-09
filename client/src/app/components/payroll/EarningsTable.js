export default function EarningsTable({
  employees,
  onEditEarning,
  visibleColumns,
  earningsTypes
}) {

  const getEarningForEmployee = (employee, earningType) => {
    return employee.employeeEarnings.find(
      (e) => e.earnings.earningsType === earningType
    );
  };

  const handleCellClick = (employee, earningType) => {
    const earning = getEarningForEmployee(employee, earningType);
    if (earning) {
      onEditEarning(earning);
    }
  };

  const formatCurrency = (value) =>
    parseFloat(value).toLocaleString("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const filteredEarningsTypes = earningsTypes.filter((type) => visibleColumns?.[type]);


  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {visibleColumns?.staffNo && (
              <th className="border px-6 py-3 text-left text-xs font-bold titlecase tracking-wider">
                Staff ID
              </th>
            )}
            {visibleColumns?.name && (
              <th className="border px-6 py-3 text-left text-xs font-bold titlecase tracking-wider">
                Employee Name
              </th>
            )}
            {visibleColumns?.basicSalary && (
              <th className="border px-6 py-3 text-left text-xs font-bold titlecase tracking-wider">
                Basic Salary
              </th>
            )}
            {filteredEarningsTypes.map((type) => (
              <th
                key={type}
                className="border px-6 py-3 text-left text-xs font-bold titlecase tracking-wider"
              >
                {type}
              </th>
            ))}

            {visibleColumns?.total && (
              <th className="border px-6 py-3 text-left text-xs font-bold titlecase tracking-wider">
                Total
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {employees.map((employee) => {
            const totalEarnings = employee.employeeEarnings.reduce(
              (sum, earning) => {
                const amount =
                  earning.calculatedAmount || earning.customMonthlyAmount || 0;
                return sum + parseFloat(amount);
              },
              0
            );

            return (
              <tr
                key={employee.id}
                className="even:bg-white odd:bg-gray-50 hover:bg-gray-100 transition"
              >
                {visibleColumns?.staffNo && (
                  <td className="border px-6 py-4 whitespace-nowrap text-sm font-bold">
                    {employee.staffNo}
                  </td>
                )}
                {visibleColumns?.name && (
                  <td className="border px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {employee.firstName} {employee.lastName}
                  </td>
                )}
                {visibleColumns?.basicSalary && (
                  <td className="border px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(employee.basicSalary)}
                  </td>
                )}
                {filteredEarningsTypes.map((type) => {
                  const earning = getEarningForEmployee(employee, type);
                  const amount =
                    earning?.calculatedAmount ||
                    earning?.customMonthlyAmount ||
                    0;

                  return(
                    <td
                      key={type}
                      className={`border px-6 py-4 whitespace-nowrap text-sm ${
                        earning
                          ? "cursor-pointer hover:underline"
                          : "text-gray-500"
                      }`}
                      onClick={() => earning && handleCellClick(employee, type)}
                    >
                      {formatCurrency(amount)}
                    </td>
                  );
                })}
                {visibleColumns?.total && (
                  <td className="border px-6 py-4 whitespace-nowrap text-sm font-bold">
                    {formatCurrency(totalEarnings)}
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
