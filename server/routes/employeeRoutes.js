const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authMiddleware, rbacMiddleware } = require('../middlewares/authMiddleware');

// Employee Creation
router.post('/', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), employeeController.createEmployee);
// Edit Employee Details
router.put('/:id',authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), employeeController.updateEmployee);
// Soft Delete Employee
router.delete('/:id',authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), employeeController.softDeleteEmployee);
// Get All Employee Related Details in Table Format
router.get('/details', employeeController.getAllEmployeeDetails);
// Search Employee by Name or Staff No
router.get('/search', employeeController.searchEmployee);
// Get All Employees in a Particular Company
router.get('/company/:companyId', employeeController.getEmployeesByCompany);
// Filter Employees Details in a Specific Company
router.get('/company/:companyId/filter',authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), employeeController.filterEmployees);
// Get All Employees (optional companyId as query param)
router.get('/', employeeController.getAllEmployees);
// Get Employee by ID
router.get('/:id', employeeController.getEmployeeById);

module.exports = router;





