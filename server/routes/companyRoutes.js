const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');

const { authMiddleware, rbacMiddleware } = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', companyController.createCompany);
router.get('/', companyController.getAllCompanies);

router.use(authMiddleware, rbacMiddleware(['SuperAdmin']));
// Private routes 
router.get('/:id', companyController.getCompanyById);
router.put('/:id', companyController.updateCompany);
router.delete('/:id', companyController.softDeleteCompany);


module.exports = router;








