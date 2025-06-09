const express = require('express');
const router = express.Router();
const advancePayController = require('../controllers/advancePayController');

// Get advance pay list with filters
router.get('/', advancePayController.getAllAdvancePays );
// Get advance pay details
router.get('/:id', advancePayController.getAdvancePayById);
// New routes for fetching employees based on advance payments
router.get('/employees/with-advance', advancePayController.getEmployeesWithAdvancePayments );
router.get('/employees/with-advance/status/:status', advancePayController.getEmployeesWithAdvancePaymentsByStatus );
router.get('/employees/with-balance', advancePayController.getEmployeesWithBalances );
router.get('/company/:companyId/employees/with-advance', advancePayController.getEmployeesWithAdvancePaymentsByCompany );

// Create new advance record for an employee
router.post('/', advancePayController.createAdvancePay);
// Update advance pay (Admin/HR/Accountant only)
router.put('/:id', advancePayController.updateAdvancePay );
// Record payment against advance
router.post('/:id/payments', advancePayController.recordPayment );
// Delete advance pay (Admin/HR only)
router.delete('/:id', advancePayController.softDeleteAdvancePay );


module.exports = router;








