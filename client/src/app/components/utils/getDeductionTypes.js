export function getDeductionTypes(employees) {
    const types = new Set();
    employees.forEach(employee => {
      employee.employeeDeductions?.forEach(deduction => {
        types.add(deduction.deduction.deductionType);
      });
    });
    return Array.from(types);
  }
  