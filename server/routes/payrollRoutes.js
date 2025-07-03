const express = require("express");
const router = express.Router();
const payrollController = require("../controllers/payrollController");
const { authMiddleware, rbacMiddleware} = require('../middlewares/authMiddleware');

router.post('/initiate/company/:companyId', authMiddleware, rbacMiddleware(['SuperAdmin', 'Admin', 'Hr', 'Accountant', 'Manager']), payrollController.getPayrollPreview);
router.post('/:companyId/submit',authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), payrollController.submitDraftPayroll);
router.post('/:companyId/approve', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']),payrollController.approvePayroll);
router.post('/:companyId/reject', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), payrollController.rejectPayroll);
router.post('/:companyId/refresh', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']),payrollController.refreshPayroll);

router.get('/all/:companyId', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']),payrollController.getAllPayrolls);
router.get('/status/:companyId/:payrollId/:status',authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), payrollController.getPayrollsByStatus);
router.delete('/company/:companyId', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']),payrollController.deletePayrollsByCompany);
router.get('/:payrollId', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']),payrollController.getPayrollById);

router.get('/companies/:companyId/summary', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), payrollController.getPayrollSummary);
router.get('/batch/:companyId/:payrollId/employee-details', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']),payrollController.getPayrollBatchDetails);
router.get('/company/:companyId/date/details', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']),payrollController.getCompanyPayrolls);


router.get('/payslip/:companyId/:employeeId/:payrollId', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), payrollController.getEmployeePayslip);
router.post('/email-payslips/:companyId', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), payrollController.sendPayslipsEmail);
router.post('/download-payslips/:companyId', authMiddleware, rbacMiddleware(['Admin', 'Hr', 'Accountant', 'SuperAdmin']), payrollController.downloadPayslipsPDF)

module.exports = router;


