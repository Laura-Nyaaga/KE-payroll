export const transformEarningsData = (employees) => {
    const earningsTypes = new Set();
  
    // Step 1: collect all unique earning types
    employees.forEach((employee) => {
      employee.employeeEarnings.forEach((earning) => {
        earningsTypes.add(earning.earnings.earningsType);
      });
    });
  
    const typesArray = Array.from(earningsTypes);
  
    // Step 2: construct a row per employee
    const transformed = employees.map((employee) => {
      const row = {
        'Staff No': employee.staffNo,
        'Employee Name': `${employee.firstName} ${employee.lastName}`,
        'Basic Salary': parseFloat(employee.basicSalary).toFixed(2),
      };
  
      let total = 0;
  
      typesArray.forEach((type) => {
        const earning = employee.employeeEarnings.find(
          (e) => e.earnings.earningsType === type
        );
        const amount = earning ? (earning.calculatedAmount || earning.customAmount || 0) : 0;
        total += parseFloat(amount);
        row[type] = parseFloat(amount).toFixed(2);
      });
  
      row['Total Earnings'] = total.toFixed(2);
  
      return row;
    });
  
    return transformed;
  };
  