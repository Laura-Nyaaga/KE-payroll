const express = require('express');
const router = express.Router();
const allowanceController = require('../controllers/allowanceController');
// Get a list of all allowances, 
router.get('/all', allowanceController.getAllSystemAllowances);
// Get all allowances associated with a specific company
router.get('/company/:companyId', allowanceController.getAllCompanyAllowances);
// Get all allowances associated with a specific employee
router.get('/:id', allowanceController.getAllowanceById);
router.get('/employee/:employeeId', allowanceController.getEmployeeAllowances);
// Filter employees' allowances by type, status, isTaxable, calculation method
router.get('/employee/:employeeId/filter', allowanceController.filterEmployeeAllowances);
// Get a list of all employees with their associated allowances
router.get('/employees/with-allowances', allowanceController.getAllEmployeesWithAllowances);
// Company-Level Allowance Routes
router.post('/', allowanceController.createAllowance);
// Update allowances associated to the company
router.patch('/:id', allowanceController.updateAllowance);
// Soft delete allowances associated to the company
router.delete('/:id', allowanceController.softDeleteAllowance);
// Employee Allowance Assignment Routes
router.post('/assign', allowanceController.assignToEmployee);
// Update specific allowances of an employee
router.patch('/employee-allowances/:id', allowanceController.updateEmployeeSpecificAllowance);
// Delete specific allowance of an employee
router.delete('/employee-allowances/:id', allowanceController.deleteEmployeeSpecificAllowance);


module.exports = router;








