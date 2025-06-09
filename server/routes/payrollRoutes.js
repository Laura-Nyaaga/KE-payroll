const express = require("express");
const router = express.Router();
const payrollController = require("../controllers/payrollController");
const { authMiddleware, rbacMiddleware} = require('../middlewares/authMiddleware');

router.post('/initiate/company/:companyId', authMiddleware, rbacMiddleware(['SuperAdmin', 'Admin', 'Hr', 'Accountant', 'Manager']), payrollController.getPayrollPreview);
router.post('/:companyId/submit',authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), payrollController.submitDraftPayroll);
router.post('/:companyId/approve', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']),payrollController.approvePayroll);
router.get('/:companyId/status/expired',authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), payrollController.getExpiredPayroll);
router.get('/:companyId/status/rejected', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']),payrollController.getRejectedPayroll);
router.post('/:companyId/refresh', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']),payrollController.refreshPayroll);

router.get('/all/:companyId', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']),payrollController.getAllPayrolls);
router.get('/status/:companyId/:payrollId/:status',authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), payrollController.getPayrollsByStatus);
router.delete('/company/:companyId', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']),payrollController.deletePayrollsByCompany);
router.get('/:payrollId', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']),payrollController.getPayrollById);

router.get('/companies/:companyId/summary', payrollController.getPayrollSummaryReport);
router.get('/employee/:payrollId/details', payrollController.getPayrollBatchDetails);
router.get('/company/:companyId/date/details', payrollController.getCompanyPayrolls);

module.exports = router;


