const { DataTypes, sequelize } = require('../config/db');
const User = require('./userModel');
const Company = require('./companyModel');
const JobTitle = require('./jobTitleModel');
const Department = require('./departmentModel');
const Project = require('./projectModel');
const Region = require('./regionModel');


const Employee = sequelize.define('Employee', {
   id: {
       type: DataTypes.INTEGER,
       primaryKey: true,
       autoIncrement: true,
    //    readOnly: true,
   },
   createdByUserId: {
       type: DataTypes.INTEGER,
       allowNull: false,
       references: {
           model: User,
           key: 'id',
       },
       validate: {
           notNull: {
               msg: 'Creator user ID is required'
           }
       },
       readOnly: true,
   },
   companyId: {
       type: DataTypes.INTEGER,
       allowNull: false,
       references: {
           model: Company,
           key: 'id',
       },
       validate: {
           notNull: {
               msg: 'Company ID is required'
           }
       },
       readOnly: true,
   },
   firstName: {
       type: DataTypes.STRING,
       allowNull: false,
       validate: {
           notEmpty: {
               msg: 'First name is required'
           },
           len: {
               args: [2, 50],
               msg: 'First name must be between 2-50 characters'
           }
       }
   },
   middleName: {
       type: DataTypes.STRING,
       validate: {
           len: {
               args: [0, 50],
               msg: 'Middle name must be less than 50 characters'
           }
       }
   },
   lastName: {
       type: DataTypes.STRING,
       allowNull: false,
       validate: {
           notEmpty: {
               msg: 'Last name is required'
           },
           len: {
               args: [2, 50],
               msg: 'Last name must be between 2-50 characters'
           }
       }
   },
   workEmail: {
       type: DataTypes.STRING,
       unique: {
           msg: 'Work email already exists'
       },
       allowNull: true,
       validate: {
           isEmail: {
               msg: 'Invalid work email format'
           }
       }
   },
   gender: {
       type: DataTypes.ENUM('Female', 'Male', 'Other', 'Prefer not to say'),
       allowNull: false,
       defaultValue: 'Prefer not to say'
   },
   dateOfBirth: {
       type: DataTypes.DATEONLY,
       validate: {
           isDate: {
               msg: 'Invalid date of birth'
           },
           isBefore: {
               args: new Date().toISOString(),
               msg: 'Date of birth must be in the past'
           }
       }
   },
   nationalId: {
       type: DataTypes.STRING,
       unique: {
           msg: 'National ID already exists'
       },
       validate: {
           len: {
               args: [7, 9],
               msg: 'National ID must be 7-9 digits'
           },
           isNumeric: {
               msg: 'National ID must contain only numbers'
           }
       }
   },
   passportNo: {
       type: DataTypes.STRING,
       unique: {
           msg: 'Passport number already exists'
       },
       validate: {
           len: {
               args: [7, 15],
               msg: 'Passport number must be 7-15 characters'
           }
       }
   },
   maritalStatus: {
       type: DataTypes.ENUM('Married', 'Single', 'Divorced', 'Widowed', 'Separated'),
       defaultValue: 'Single'
   },
   residentialStatus: {
       type: DataTypes.ENUM('Resident', 'Non-Resident'),
       defaultValue: 'Resident'
   },
  passportPhoto: {
  type: DataTypes.STRING,
  validate: {
    customUrlValidation(value) {
      if (!/^https?:\/\/.+/i.test(value)) {
        throw new Error('Invalid passport photo URL');
      }
    },
  },
},
   staffNo: {
       type: DataTypes.STRING,
       unique: {
           msg: 'Staff number already exists'
       },
       allowNull: false,
       validate: {
           notEmpty: {
               msg: 'Staff number is required'
           }
       }
   },
   jobTitleId: {
       type: DataTypes.INTEGER,
       allowNull: false,
       references: {
           model: JobTitle,
           key: 'id',
       },
       validate: {
           notNull: {
               msg: 'Job title is required'
           }
       }
   },
   jobGroup: {
       type: DataTypes.STRING,
       allowNull: null,
   },
   departmentId: {
       type: DataTypes.INTEGER,
       allowNull: false,
       references: {
           model: Department,
           key: 'id',
       },
       validate: {
           notNull: {
               msg: 'Department is required'
           }
       }
   },
   regionId: {
       type: DataTypes.INTEGER,
       allowNull: true,
       references: {
           model: Region,
           key: 'id',
       },
   },
   projectId: {
       type: DataTypes.INTEGER,
       references: {
           model: Project,
           key: 'id',
       }
   },
   currency: {
       type: DataTypes.STRING,
       defaultValue: 'KES',
       validate: {
           isIn: {
               args: [['KES', 'USD', 'EUR', 'GBP']],
               msg: 'Invalid currency'
           }
       }
   },
   employmentType: {
       type: DataTypes.ENUM('Permanent', 'Full-Time', 'Regular', 'Contract', 'Internship', 'Probationary', 'Part-Time', 'Casual'),
       allowNull: false,
       defaultValue: 'Permanent',
       validate: {
           notNull: { msg: 'Employment type is required' }
       }
   },
   // Employment details as explicit fields instead of JSON
   employmentDate: {
       type: DataTypes.DATEONLY,
       allowNull: false,
       validate: {
           notNull: { msg: 'Employment date is required' },
           isDate: { msg: 'Invalid employment date' },
           isBefore: {
               args: new Date().toISOString(),
               msg: 'Employment date must be in the past'
           }
       }
   },
   endDate: {
       type: DataTypes.DATEONLY,
       allowNull: true,
       validate: {
           isDate: { msg: 'Invalid end date' },
           isAfterEmploymentDate(value) {
               if (value && new Date(value) <= new Date(this.employmentDate)) {
                   throw new Error('End date must be after employment date');
               }
           },
           requiredForCertainTypes(value) {
               const requiresEndDate = ['Contract', 'Internship', 'Probationary', 'Casual'];
               if (requiresEndDate.includes(this.employmentType) && !value) {
                   throw new Error(`End date is required for ${this.employmentType} employees`);
               }
           }
       }
   },
   terminationDate: {
       type: DataTypes.DATEONLY,
       allowNull: true,
       validate: {
           isDate: { msg: 'Invalid termination date' },
           isAfterEmploymentDate(value) {
               if (value && new Date(value) <= new Date(this.employmentDate)) {
                   throw new Error('Termination date must be after employment date');
               }
           }
       }
   },
   resignationDate: {
       type: DataTypes.DATEONLY,
       allowNull: true,
       validate: {
           isDate: { msg: 'Invalid resignation date' },
           isAfterEmploymentDate(value) {
               if (value && new Date(value) <= new Date(this.employmentDate)) {
                   throw new Error('Resignation date must be after employment date');
               }
           }
       }
   },
   modeOfPayment: {
       type: DataTypes.ENUM('monthly', 'weekly', 'daily', 'hourly'),
       allowNull: false,
       defaultValue: 'monthly',
       validate: {
           notNull: { msg: 'Mode of payment is required' }
       }
   },
   amountPerRate: {
       type: DataTypes.DECIMAL(10, 2),
       allowNull: false,
       defaultValue: 0,
       validate: {
           notNull: { msg: 'Amount per rate is required' },
           min: {
               args: [0],
               msg: 'Amount per rate cannot be negative'
           }
       }
   },
   unitsWorked: {
       type: DataTypes.DECIMAL(10, 2),
       allowNull: true,
       defaultValue: null,
       validate: {
           min: {
               args: [0],
               msg: 'Units worked cannot be negative'
           },
           requiredForNonMonthlyPayment(value) {
               if (this.modeOfPayment !== 'monthly' && (value === null || value === undefined)) {
                   throw new Error(`Units worked is required for ${this.modeOfPayment} payment mode`);
               }
           }
       }
   },
   basicSalary: {
       type: DataTypes.DECIMAL(10, 2),
       allowNull: false,
       defaultValue: 0,
       readOnly: true,
       validate: {
           min: {
               args: [0],
               msg: 'Basic salary cannot be negative'
           }
       }
   },
   lastLeaveReset: {
       type: DataTypes.DATEONLY,
       allowNull: true,
       validate: {
           isDate: { msg: 'Invalid last leave reset date' }
       }
   },
   accumulatedLeaveDays: {
       type: DataTypes.DECIMAL(10, 2),
       defaultValue: 0,
       readOnly: true,
       validate: {
           min: {
               args: [0],
               msg: 'Leave days cannot be negative'
           }
       }
   },
   utilizedLeaveDays: {
       type: DataTypes.DECIMAL(10, 2),
       defaultValue: 0,
       validate: {
           min: {
               args: [0],
               msg: 'Utilized leave days cannot be negative'
           },
           lessThanAccumulated(value) {
               if (value > this.accumulatedLeaveDays) {
                   throw new Error('Utilized leave days cannot exceed accumulated leave days');
               }
           }
       }
   },
   isEligibleForLeave: {
       type: DataTypes.VIRTUAL,
       get() {
           return ['Permanent', 'Full-Time', 'Regular'].includes(this.employmentType);
       }
   },
   isExemptedFromTax: {
       type: DataTypes.BOOLEAN,
       defaultValue: false,
   },
   taxCertificateNo: {
       type: DataTypes.STRING,
       allowNull: true,
   },
   exemptedAmount: {
       type: DataTypes.DECIMAL(10, 2),
       allowNull: true,
   },
   uploadTaxCertificate: {
       type: DataTypes.STRING,
       allowNull: true,
   },
   status: {
       type: DataTypes.ENUM('Active', 'Inactive'),
       defaultValue: 'Active'
   },
   paymentMethod: {
       type: DataTypes.ENUM('cash', 'cheque', 'bank', 'mobileMoney'),
       allowNull: false,
       defaultValue: 'bank'
   },
   accountName: {
       type: DataTypes.STRING,
       allowNull: true,
       validate: {
           len: {
               args: [2, 100],
               msg: 'Account name must be between 2 and 100 characters'
           },
           requiredIfBankOrCheque(value) {
               if (['bank', 'cheque'].includes(this.paymentMethod) && (value === null || value === undefined || value === '')) {
                   throw new Error('Account name is required for bank and cheque payments');
               }
           }
       }
   },
   accountNumber: {
       type: DataTypes.STRING,
       allowNull: true,
       validate: {
           isNumeric: {
               msg: 'Account number must contain only numbers'
           },
           len: {
               args: [5, 20],
               msg: 'Account number must be between 5 and 20 digits'
           },
           requiredIfBankOrCheque(value) {
               if (['bank', 'cheque'].includes(this.paymentMethod) && (value === null || value === undefined || value === '')) {
                   throw new Error('Account number is required for bank and cheque payments');
               }
           }
       }
   },
   bankName: {
       type: DataTypes.STRING,
       allowNull: true,
       validate: {
           len: {
               args: [2, 100],
               msg: 'Bank name must be between 2 and 100 characters'
           },
           requiredIfBankOrCheque(value) {
               if (['bank', 'cheque'].includes(this.paymentMethod) && (value === null || value === undefined || value === '')) {
                   throw new Error('Bank name is required for bank and cheque payments');
               }
           }
       }
   },
   bankCode: {
       type: DataTypes.STRING,
       allowNull: true,
       validate: {
           len: {
               args: [3, 20],
               msg: 'Bank code must be between 3 and 20 characters'
           },
           requiredIfBankOrCheque(value) {
               if (['bank', 'cheque'].includes(this.paymentMethod) && (value === null || value === undefined || value === '')) {
                   throw new Error('Bank code is required for bank and cheque payments');
               }
           }
       }
   },
   branchName: {
       type: DataTypes.STRING,
       allowNull: true,
       validate: {
           len: {
               args: [2, 100],
               msg: 'Branch name must be between 2 and 100 characters'
           },
           requiredIfBankOrCheque(value) {
               if (['bank', 'cheque'].includes(this.paymentMethod) && (value === null || value === undefined || value === '')) {
                   throw new Error('Branch name is required for bank and cheque payments');
               }
           }
       }
   },
   branchCode: {
       type: DataTypes.STRING,
       allowNull: true,
       validate: {
           len: {
               args: [3, 20],
               msg: 'Branch code must be between 3 and 20 characters'
           },
           requiredIfBankOrCheque(value) {
               if (['bank', 'cheque'].includes(this.paymentMethod) && (value === null || value === undefined || value === '')) {
                   throw new Error('Branch code is required for bank and cheque payments');
               }
           }
       }
   },
   mobileNumber: {
       type: DataTypes.STRING,
       allowNull: true,
       validate: {
           isNumeric: {
               msg: 'Mobile number must contain only numbers'
           },
           len: {
               args: [7, 15],
               msg: 'Mobile number must be between 7 and 15 digits'
           },
           requiredIfMobileMoney(value) {
               if (this.paymentMethod === 'mobileMoney' && (value === null || value === undefined || value === '')) {
                   throw new Error('Mobile number is required for mobileMoney payments');
               }
           }
       }
   },
   personalEmail: {
       type: DataTypes.STRING,
       allowNull: true,
       validate: {
           isEmail: {
               msg: 'Invalid personal email format'
           },
       },
   },
   reportingToId: {
       type: DataTypes.INTEGER,
       allowNull: true,
       references: {
           model: 'Employee',
           key: 'id',
       },
       onUpdate: 'CASCADE',
       onDelete: 'SET NULL',
   },
   createdAt: {
       type: DataTypes.DATE,
       defaultValue: DataTypes.NOW,
       readOnly: true,
   },
   updatedAt: {
       type: DataTypes.DATE,
       defaultValue: DataTypes.NOW,
       readOnly: true,
   },
   deletedAt: {
       type: DataTypes.DATE,
       allowNull: true
   }
}, {
   hooks: {
       beforeValidate: (employee) => {
           // Default account name for bank/cheque payments
           if (['bank', 'cheque'].includes(employee.paymentMethod) && !employee.accountName) {
               employee.accountName = `${employee.firstName} ${employee.middleName || ''} ${employee.lastName}`.trim();
           }
           
           // Ensure units worked is null for monthly payments
           if (employee.modeOfPayment === 'monthly') {
               employee.unitsWorked = null;
           }
       },
       beforeCreate: calculateEmployeeDetails,
       beforeUpdate: calculateEmployeeDetails
   },
   tableName: 'Employees',
   modelName: 'Employee',
   underscored: false,
   timestamps: true,
   paranoid: true,
   defaultScope: {
       attributes: { exclude: ['deletedAt'] }
   },
   scopes: {
       active: {
           where: { status: 'Active' }
       }
   }
});

Employee.belongsToMany(Project, {
  through: 'ProjectMembers',
  as: 'assignedProjects',
  foreignKey: 'employeeId',
});


// Function to calculate basic salary and accumulated leave days
function calculateEmployeeDetails(employee) {
    // Calculate basic salary based on mode of payment
    if (employee.modeOfPayment === 'monthly') {
        employee.basicSalary = employee.amountPerRate;
    } else {
        // For hourly, daily, weekly, calculate based on units worked
        employee.basicSalary = (employee.amountPerRate || 0) * (employee.unitsWorked || 0);
    }
    
    // Ensure the value is rounded to 2 decimal places
    employee.basicSalary = parseFloat(employee.basicSalary.toFixed(2));
    
    // Calculate accumulated leave days only for eligible employees
    if (['Permanent', 'Full-Time', 'Regular'].includes(employee.employmentType)) {
        const employmentDate = new Date(employee.employmentDate);
        const currentDate = new Date();
        
        // Get/set the last leave reset date (should be initialized to employment date)
        let lastLeaveResetDate = employee.lastLeaveReset ? new Date(employee.lastLeaveReset) : new Date(employmentDate);
        
        // Check if today is employment anniversary
        const isAnniversaryToday = 
            currentDate.getMonth() === employmentDate.getMonth() && 
            currentDate.getDate() === employmentDate.getDate() && 
            currentDate.getFullYear() > employmentDate.getFullYear();
        
        // If it's the anniversary, reset both accumulated and utilized leave days
        if (isAnniversaryToday) {
            // Update the last reset date to today
            employee.lastLeaveReset = currentDate;
            lastLeaveResetDate = new Date(currentDate);
            
            // Reset both accumulated and utilized leave days to zero
            employee.accumulatedLeaveDays = 0;
            employee.utilizedLeaveDays = 0;
        }
        
        // Calculate months since last leave reset date
        const monthsSinceLastReset = 
            (currentDate.getFullYear() - lastLeaveResetDate.getFullYear()) * 12 + 
            (currentDate.getMonth() - lastLeaveResetDate.getMonth()) +
            (currentDate.getDate() >= lastLeaveResetDate.getDate() ? 0 : -1);
        
        // Each month accumulates 1.75 leave days
        const accruedLeaveSinceLastReset = monthsSinceLastReset * 1.75;
        
        // Accumulated leave is newly accrued leave minus utilized
        employee.accumulatedLeaveDays = Math.max(0, accruedLeaveSinceLastReset - employee.utilizedLeaveDays);
        
        // Round to 2 decimal places
        employee.accumulatedLeaveDays = parseFloat(employee.accumulatedLeaveDays.toFixed(2));
    } else {
        // Non-eligible employees have 0 accumulated leave
        employee.accumulatedLeaveDays = 0;
        employee.utilizedLeaveDays = 0;
    }
}



module.exports = Employee;



