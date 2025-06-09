const express = require('express');
const router = express.Router();
const { authMiddleware, rbacMiddleware } = require('../middlewares/authMiddleware');

const deductionController = require('../controllers/deductionController');
// Get a list of all deductions,
router.get('/all', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), deductionController.getAllSystemDeductions);
// Get all deductions associated with a specific company
router.get('/company/:companyId', authMiddleware, deductionController.getAllCompanyDeductions);
router.get('/:id', deductionController.getDeductionById);
router.get('/employee/:employeeId', deductionController.getEmployeeDeductions);
// Filter employees' deductions by type, status, calculation method
router.get('/employee/:employeeId/filter', deductionController.filterEmployeeDeductions);
// Get a list of all employees with their associated deductions
router.get('/employees/with-deductions', deductionController.getAllEmployeesWithDeductions);
// Company-Level Deduction Routes
router.post('/', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), deductionController.createDeduction);
// Update deductions associated to the company
router.patch('/:id', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), deductionController.updateDeduction);
// Soft delete deductions associated to the company
router.delete('/:id', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), deductionController.softDeleteDeduction);

// Employee Deduction Assignment Routes
router.post('/assign',authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), deductionController.assignToEmployee);
// Update specific deduction of an employee
router.patch('/employee-deductions/:id', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), deductionController.updateEmployeeSpecificDeduction);
// Delete specific deduction of an employee
router.delete('/employee-deductions/:id', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), deductionController.deleteEmployeeSpecificDeduction);
// Get All Employees with Deductions for a Specific Company
router.get(
    '/companies/:companyId/employees-with-deductions', authMiddleware,
    deductionController.getAllEmployeesWithDeductionsByCompany
);


module.exports = router;

