export function getFormattedTableData(employees, deductionTypes) {
    const headers = ['Staff Id', 'Employee Names', 'Basic Salary', ...deductionTypes, 'Total'];
    const rows = employees.map(employee => {
      const row = [];
      row.push(employee.staffNo);
      row.push(`${employee.firstName} ${employee.lastName}`);
      row.push(parseFloat(employee.basicSalary).toFixed(2));
  
      let total = 0;
  
      deductionTypes.forEach(type => {
        const deduction = employee.employeeDeductions.find(
          d => d.deduction.deductionType === type
        );
        const amount = deduction ? parseFloat(deduction.calculatedAmount || deduction.customAmount || 0) : 0;
        row.push(amount.toFixed(2));
        total += amount;
      });
  
      row.push(total.toFixed(2));
      return row;
    });
  
    return [headers, ...rows];
  }
  