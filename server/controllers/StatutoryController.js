// controllers/StatutoryController.js
const PayrollCalculationService = require('../utils/payrollCalculationService');
const { Employee } = require('../models');

const getCompanyStatutoryDeductions = async (req, res) => {
  const { companyId, start, end } = req.query;

  if (!companyId || !start || !end) {
    return res.status(400).json({ message: 'companyId, start, and end dates are required.' });
  }

  try {
    const employees = await Employee.findAll({ where: { companyId } });
    const payrollPeriod = { start, end };

    const results = [];
    for (const employee of employees) {
      const payroll = await PayrollCalculationService.calculateEmployeePayroll(
        employee,
        payrollPeriod,
      );

      results.push({
        staffNo: employee.staffNo,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        statutory: payroll.statutory
      });
    }

    return res.json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error calculating statutory deductions.' });
  }
};

module.exports = { getCompanyStatutoryDeductions };
