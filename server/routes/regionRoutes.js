const express = require('express');
const router = express.Router();
const regionController = require('../controllers/regionController');

const { authMiddleware, rbacMiddleware } = require('../middlewares/authMiddleware'); 

router.get('/companies/:companyId', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), regionController.getRegionsByCompany);
router.get('/', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), regionController.getAllRegions);

router.use(authMiddleware, rbacMiddleware(['Admin', 'SuperAdmin', 'Manager'])); 
router.post('/', regionController.createRegion);
router.get('/:id', regionController.getRegionById);
router.put('/:id', regionController.updateRegion);
router.delete('/:id', regionController.softDeleteRegion);

module.exports = router;








