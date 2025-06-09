const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, rbacMiddleware} = require('../middlewares/authMiddleware');

router.get('/', userController.getAllUsers);
router.get('/:id', authMiddleware, rbacMiddleware(['SuperAdmin', 'Admin', 'Hr', 'Accountant', 'Manager']), userController.getUserById);
router.get('/company/:companyId', userController.getUsersByCompanyId);

router.post('/register', authMiddleware, rbacMiddleware(['SuperAdmin']), userController.createUser);
router.delete('/:id', authMiddleware, rbacMiddleware(['SuperAdmin']), userController.softDeleteUser);
router.put('/:id', authMiddleware, rbacMiddleware(['SuperAdmin', 'Admin', 'Hr', 'Accountant', 'Manager']), userController.updateUser);

module.exports = router;



