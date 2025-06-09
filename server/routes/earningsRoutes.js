const express = require('express');
const router = express.Router();
const earningsController = require('../controllers/earningsController');
const { authMiddleware, rbacMiddleware } = require('../middlewares/authMiddleware');

// Get a list of all earnings, regardless of the company
router.get('/all', earningsController.getAllSystemEarnings);
// Get all earnings associated with a specific company
router.get('/company/:companyId', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), earningsController.getAllCompanyEarnings);
router.get('/:id', earningsController.getEarningsById);
router.get('/employee/:employeeId', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), earningsController.getEmployeeEarnings);
// Filter employees' earnings by type, status, calculation method
router.get('/employee/:employeeId/filter', earningsController.filterEmployeeEarnings);
// Get a list of all employees with their associated earnings
router.get('/employees/with-earnings', earningsController.getAllEmployeesWithEarnings);
// Company-Level Earnings Routes
router.post('/', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), earningsController.createEarnings);
// Update earnings associated to the company
router.patch('/:id',authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), earningsController.updateEarnings);
// Soft delete earnings associated to the company
router.delete('/:id',authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), earningsController.softDeleteEarnings);
// Employee Earnings Assignment Routes
router.post('/assign',authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), earningsController.assignToEmployee);
// Update specific earning of an employee
router.patch('/employee-earnings/:id',authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), earningsController.updateEmployeeSpecificEarning);
// Delete specific earning of an employee
router.delete('/employee-earnings/:id', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), earningsController.deleteEmployeeSpecificEarning);
// Get All Employees with Earnings for a Specific Company
router.get(
    '/companies/:companyId/employees-with-earnings', authMiddleware,
    earningsController.getAllEmployeesWithEarningsByCompany
);

router.delete('/earnings/permanent/:id', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), earningsController.permanentlyDeleteEarnings);

// routes/earnings.js or wherever you register routes
router.delete('/earnings/delete-all', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), earningsController.deleteAllEarnings);


module.exports = router;








