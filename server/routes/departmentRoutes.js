const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authMiddleware, rbacMiddleware } = require('../middlewares/authMiddleware');

router.get('/', departmentController.getAllDepartments);
router.get('/companies/:companyId', departmentController.getDepartmentsByCompany);
router.post('/', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), departmentController.createDepartment);
router.get('/:id', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']),departmentController.getDepartmentById);
router.put('/:id', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), departmentController.updateDepartment);
router.delete('/:id', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), departmentController.softDeleteDepartment);

module.exports = router;









