const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authMiddleware, rbacMiddleware } = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), projectController.getAllProjects);
router.get('/companies/:companyId',  projectController.getProjectsByCompany);
router.post('/', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), projectController.createProject);
router.get('/:id', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), projectController.getProjectById);
router.put('/:id', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), projectController.updateProject);
router.delete('/:id', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), projectController.softDeleteProject);

module.exports = router;









