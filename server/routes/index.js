// const { sequelize } = require('../config/db');
const express = require('express');

const employeeRoutes = require('./employeeRoutes');
const departmentRoutes = require('./departmentRoutes');
const userRoutes = require('./userRoutes');
const companyRoutes = require('./companyRoutes');
const projectRoutes = require('./projectRoutes');
const regionRoutes = require('./regionRoutes');
const jobTitleRoutes = require('./jobTitleRoutes');
const payslipRoutes = require('./payslipRoutes');
const earningsRoutes = require('./earningsRoutes');
const advancePayRoutes = require('./advancePayRoutes');
const allowanceRoutes = require('./allowanceRoutes');
const payrollRoutes = require('./payrollRoutes');
const deductionRoutes = require('./deductionRoutes');
const authRoutes = require('./authRoutes');
const uploadRoutes = require('./uploadRoutes');
const statutoryRoutes = require('./statutoryRoutes');


const router = express.Router();

router.use('/api/employees', employeeRoutes);
router.use('/api/departments', departmentRoutes);
router.use('/api/users', userRoutes);
router.use('/api/companies', companyRoutes);
router.use('/api/projects', projectRoutes);
router.use('/api/regions', regionRoutes);
router.use('/api/job-titles', jobTitleRoutes);
router.use('/api/payslips', payslipRoutes);
router.use('/api/earnings', earningsRoutes);
router.use('/api/advance-pays', advancePayRoutes);
router.use('/api/allowances', allowanceRoutes);
router.use('/api/payrolls', payrollRoutes);
router.use('/api/deductions', deductionRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/upload', uploadRoutes);
router.use('/api/statutory',statutoryRoutes); 


module.exports = router;