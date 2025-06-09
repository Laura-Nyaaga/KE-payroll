const { Deduction, Employee } = require('../models');

// Fetch deduction and validate its existence
async function getValidDeduction(deductionId, transaction = null) {
  const deduction = await Deduction.findOne({
    where: { id: deductionId, deletedAt: null },
    transaction
  });
  if (!deduction) throw new Error('Deduction not found');
  return deduction;
}

// Fetch employee and validate its existence
async function getValidEmployee(employeeId, transaction = null) {
  const employee = await Employee.findOne({
    where: { id: employeeId, deletedAt: null },
    attributes: ['id', 'firstName', 'lastName', 'staffNo', 'basicSalary'],
    transaction
  });
  if (!employee) throw new Error('Employee not found');
  return employee;
}

module.exports = {
  getValidDeduction,
  getValidEmployee
};
