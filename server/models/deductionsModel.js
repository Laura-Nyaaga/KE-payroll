const { DataTypes, sequelize } = require('../config/db');
const Company = require('./companyModel');
const Employee = require('./employeesModel');

const Deduction = sequelize.define('Deduction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
        }
    },
    deductionType: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: {
                msg: 'Deduction type is required'
            },
            len: {
                args: [2, 100],
                msg: 'Deduction type must be between 2-100 characters'
            }
        }
    },
    calculationMethod: {
        type: DataTypes.ENUM('fixed_amount', 'percentage'),
        allowNull: false,
        defaultValue: 'fixed_amount'
    },
    isTaxable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    mode: {
        type: DataTypes.ENUM('monthly', 'hourly', 'daily', 'weekly'),
        allowNull: false,
        defaultValue: 'monthly',
          
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    paranoid: true,
    validate: {
        modeMatchesCalculationMethod() {
          if (this.calculationMethod === 'percentage' && this.mode !== 'monthly') {
            throw new Error('Percentage-based deductions must have "monthly" mode.');
          }
        }
      },
    indexes: [
        {
            fields: ['companyId', 'deductionType'],
            unique: true,
            name: 'unique_deduction_type_per_company'
        }
    ]
});

const EmployeeDeduction = sequelize.define('EmployeeDeduction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Employee,
            key: 'id'
        }
    },
    deductionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Deduction,
            key: 'id'
        }
    },
    effectiveDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        validate: {
            isAfter: {
                args: [new Date().toISOString().split('T')[0]],
                msg: 'Effective date must be after the current date'
            }
        }
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isAfter: {
                args: [new Date().toISOString().split('T')[0]],
                msg: 'End date must be after the current date'
            }
        }
    },
    customPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    customMonthlyAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    customNumberOfHours: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    customHourlyRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    customNumberOfWeeks: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    customWeeklyRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    customNumberOfDays: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    customDailyRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active'
    },
    calculatedAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    }
}, {
    timestamps: true,
    // validate: {
    //   async effectiveDateNotBeforeDeductionStart() {
    //     if (this.effectiveDate && this.deductionId) {
    //       const deduction = await Deduction.findByPk(this.deductionId);
    //       if (deduction && new Date(this.effectiveDate) < new Date(deduction.startDate)) {
    //         throw new Error('Effective date cannot be before the deduction start date.');
    //       }
    //     }
    //   }
    // },
    indexes: [
        {
            fields: ['employeeId', 'deductionId', 'effectiveDate'],
            unique: true,
            name: 'unique_employee_deduction_date'
        }
    ],
    hooks: {
        beforeCreate: async (employeeDeduction) => {
            await calculateDeductionAmount(employeeDeduction);
        },
        beforeUpdate: async (employeeDeduction) => {
            const relevantFields = [
              'customAmount',
              'customPercentage',
              'customNumberOfHours',
              'customHourlyRate',
              'customNumberOfWeeks',
              'customWeeklyRate',
              'customNumberOfDays',
              'customDailyRate',
            ];
        
            const changed = relevantFields.some((field) => 
              employeeDeduction.changed(field)
          );
            if (changed) {
              await calculateDeductionAmount(employeeDeduction);
            }
          }
    }
});

async function calculateDeductionAmount(employeeDeduction) {
    const deduction = await Deduction.findByPk(employeeDeduction.deductionId);
    const employee = await Employee.findByPk(employeeDeduction.employeeId);
  
    if (!deduction || !employee) return;
  
    const { calculationMethod, mode } = deduction;
  
    if (calculationMethod === 'percentage') {
      if (mode !== 'monthly') {
        throw new Error('Percentage-based deductions must have "monthly" mode.');
      }
  
      if (
        employeeDeduction.customPercentage === null ||
        employeeDeduction.customPercentage === undefined
      ) {
        throw new Error('Custom percentage is required for percentage-based deductions.');
      }
      employeeDeduction.calculatedAmount =
        employee.basicSalary * (employeeDeduction.customPercentage / 100);
    }
  
    else if (calculationMethod === 'fixed_amount') {
      switch (mode) {
        case 'monthly':
          if (
            employeeDeduction.customMonthlyAmount === null ||
            employeeDeduction.customMonthlyAmount === undefined
          ) {
            throw new Error('Custom amount is required for monthly fixed deductions.');
          }
          employeeDeduction.calculatedAmount = employeeDeduction.customMonthlyAmount;
          break;
  
        case 'hourly':
          if (
            employeeDeduction.customNumberOfHours === null ||
            employeeDeduction.customHourlyRate === null
          ) {
            throw new Error('Both custom hours and hourly rate are required for hourly deductions.');
          }
          employeeDeduction.calculatedAmount =
            employeeDeduction.customNumberOfHours * employeeDeduction.customHourlyRate;
          break;
  
        case 'daily':
          if (
            employeeDeduction.customNumberOfDays === null ||
            employeeDeduction.customDailyRate === null
          ) {
            throw new Error('Both custom days and daily rate are required for daily deductions.');
          }
          employeeDeduction.calculatedAmount =
            employeeDeduction.customNumberOfDays * employeeDeduction.customDailyRate;
          break;
  
        case 'weekly':
          if (
            employeeDeduction.customNumberOfWeeks === null ||
            employeeDeduction.customWeeklyRate === null
          ) {
            throw new Error('Both custom weeks and weekly rate are required for weekly deductions.');
          }
          employeeDeduction.calculatedAmount =
            employeeDeduction.customNumberOfWeeks * employeeDeduction.customWeeklyRate;
          break;
  
        default:
          throw new Error(`Unsupported mode: ${mode}`);
      }
    } else {
      throw new Error(`Unsupported calculation method: ${calculationMethod}`);
    }
  }
  
module.exports = { Deduction, EmployeeDeduction, calculateDeductionAmount };


