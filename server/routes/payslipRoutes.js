const express = require('express');
const router = express.Router();
const payslipController = require('../controllers/payslipController');
// const { authenticateToken } = require('../middlewares/authMiddleware');


// router.use(authenticateToken);
// router.post('/', payslipController.createPayslip);
router.get('/', payslipController.getAllPayslips);
router.get('/:id', payslipController.getPayslipById);
router.put('/:id', payslipController.updatePayslip);
router.delete('/:id', payslipController.softDeletePayslip);

module.exports = router;