const { sequelize, DataTypes }  = require('../config/db'); 

const Company = require('./companyModel');
const User = require('./userModel');
const Department = require('./departmentModel');
const Region = require('./regionModel');
const JobTitle = require('./jobTitleModel');
const Employee = require('./employeesModel');
const Project = require('./projectModel');
const AdvancePay = require('./advanceModel');
const { Earnings, EmployeeEarnings } = require('./earningsModel');
const { Deduction, EmployeeDeduction} = require('./deductionsModel');
const { Payroll, PayrollItem } = require('./payrollModel');
const PayrollStore = require('./payrollStoreModel');


// MODELS ASSOCIATIONS

// EMPLOYEE ASSOCIATION
Employee.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdBy' });
Employee.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Employee.belongsTo(JobTitle, { foreignKey: 'jobTitleId', as: 'jobTitle' });
Employee.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Employee.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Employee.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });
Employee.belongsTo(Employee, { foreignKey: 'reportingToId', as: 'reportsTo',targetKey: 'id', scope: { deletedAt: null } });
Employee.hasMany(Employee, { foreignKey: 'reportingToId', as: 'subordinates', sourceKey: 'id' });

// USER ASSOCIATION
Company.hasMany(User, { foreignKey: 'companyId', as: 'users', onDelete: 'CASCADE', hooks: true });
User.belongsTo(Company, { foreignKey: 'companyId', as: 'company'});
User.hasMany(Employee, { foreignKey: 'createdByUserId', as: 'createdEmployees' }); 

// DEDUCTION ASSOCIATION
Company.hasMany(Deduction, { foreignKey: 'companyId', as: 'deductions' });
Deduction.belongsTo(Company, { foreignKey: 'companyId', as: 'company'});
Deduction.belongsToMany(Employee, { through: EmployeeDeduction, foreignKey: 'deductionId', otherKey: 'employeeId', as: 'employees' });
Employee.belongsToMany(Deduction, { through: EmployeeDeduction, foreignKey: 'employeeId', otherKey: 'deductionId', as: 'deductions' });
Employee.hasMany(EmployeeDeduction, { foreignKey: 'employeeId', as: 'employeeDeductions' });
EmployeeDeduction.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
Deduction.hasMany(EmployeeDeduction, { foreignKey: 'deductionId', as: 'employeeDeductions' });
EmployeeDeduction.belongsTo(Deduction, { foreignKey: 'deductionId', as: 'deduction' });

// EARNINGS ASSOCIATION
Company.hasMany(Earnings, { foreignKey: 'companyId', as: 'earnings' });
Earnings.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Earnings.belongsToMany(Employee, { through: EmployeeEarnings, foreignKey: 'earningsId', otherKey: 'employeeId', as: 'employees' });
EmployeeEarnings.belongsTo(Earnings, { foreignKey: 'earningsId', as: 'earnings' });
EmployeeEarnings.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
Employee.hasMany(EmployeeEarnings, { foreignKey: 'employeeId', as: 'employeeEarnings' });
Earnings.hasMany(EmployeeEarnings, { foreignKey: 'earningsId', as: 'employeeEarnings' });

// PAYROLL ASSOCIATION
// Company-Level
Company.hasMany(Payroll, { foreignKey: 'companyId', as: 'payrolls' });
Payroll.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// User Approvals
Payroll.belongsTo(User, { foreignKey: 'processedBy', as: 'processor' });
Payroll.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

// Batch-to-Items
Payroll.hasMany(PayrollItem, { foreignKey: 'payrollId', as: 'items' });
PayrollItem.belongsTo(Payroll, { foreignKey: 'payrollId', as: 'payroll' });
Employee.hasMany(PayrollItem, { foreignKey: 'employeeId', as: 'PayrollItems' });

// Item-to-Employee
PayrollItem.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

// Payroll Storage
Payroll.hasOne(PayrollStore, { foreignKey: 'payrollId', as: 'storedPayroll' });
Company.hasMany(PayrollStore, { foreignKey: 'companyId', as: 'payrollHistory' });

// ADVANCE PAYMENT ASSOCIATION
Employee.hasMany(AdvancePay, { foreignKey: 'employeeId', as: 'advancePays' });
AdvancePay.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

// JOB TITLE ASSOCIATION
JobTitle.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(JobTitle, { foreignKey: 'companyId', as: 'jobTitles' });
JobTitle.hasMany(Employee, { foreignKey: 'jobTitleId', as: 'employees' });

// DEPARTMENT ASSOCIATION
Department.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(Department, { foreignKey: 'companyId', as: 'departments' });
Department.hasMany(Employee, { foreignKey: 'departmentId', as: 'employees' });

// PROJECT ASSOCIATION
Project.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(Project, { foreignKey: 'companyId', as: 'projects' });
Project.hasMany(Employee, { foreignKey: 'employeeId', as: 'employees' });
// Project.belongsTo(Employee, { foreignKey: 'inchargeId', as: 'incharge' });
// Employee.hasMany(Project, { foreignKey: 'inchargeId', as: 'inchargeProjects' });
// Project.belongsToMany(Employee, { through: 'ProjectMembers', as: 'members', foreignKey: 'projectId'});


// REGION ASSOCIATION
Region.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(Region, { foreignKey: 'companyId', as: 'regions' });
Region.hasMany(Employee, { foreignKey: 'employeeId', as: 'employees' });

module.exports = {
  Company,
  User,
  Department,
  Region,
  JobTitle,
  Employee,
  Project,
  Earnings,
  EmployeeEarnings,
  EmployeeDeduction,
  AdvancePay,
  Deduction,
  Payroll,
  PayrollItem,
  PayrollStore,
  sequelize, 
  DataTypes, 
};

