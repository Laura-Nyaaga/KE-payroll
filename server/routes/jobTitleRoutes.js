// routes/jobTitleRoutes.js
const express = require('express');
const router = express.Router();
const jobTitleController = require('../controllers/jobTitleController');
const { authMiddleware, rbacMiddleware } = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), jobTitleController.createJobTitle);
router.get('/', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), jobTitleController.getAllJobTitles);
router.get('/companies/:companyId', jobTitleController.getJobTitlesByCompany);
router.get('/:id',authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), jobTitleController.getJobTitleById);
router.put('/:id',authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), jobTitleController.updateJobTitle);
router.delete('/:id',authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), jobTitleController.softDeleteJobTitle);

module.exports = router;







