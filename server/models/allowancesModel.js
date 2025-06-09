const { DataTypes, sequelize } = require('../config/db');
const Company = require('./companyModel');
const Employee = require('./employeesModel');

const Allowance = sequelize.define('Allowance', {
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
    allowanceType: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Allowance type is required'
            },
            len: {
                args: [2, 100],
                msg: 'Allowance type must be between 2-100 characters'
            }
        }
    },
    calculationMethod: {
        type: DataTypes.ENUM('fixed_amount', 'percentage'),
        allowNull: false,
        defaultValue: 'fixed_amount'
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        validate: {
            min: {
                args: [0],
                msg: 'Amount cannot be negative'
            },
            requiredIfFixed(value) {
                if (this.calculationMethod === 'fixed_amount' && (value === null || value === undefined)) {
                    throw new Error('Amount is required for fixed amount allowances');
                }
            }
        }
    },
    percentage: {
        type: DataTypes.DECIMAL(5, 2),
        validate: {
            min: {
                args: [0],
                msg: 'Percentage cannot be negative'
            },
            max: {
                args: [100],
                msg: 'Percentage cannot exceed 100%'
            },
            requiredIfPercentage(value) {
                if (this.calculationMethod === 'percentage' && (value === null || value === undefined)) {
                    throw new Error('Percentage is required for percentage-based allowances');
                }
            }
        }
    },
    isTaxable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
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
    indexes: [
        {
            fields: ['companyId', 'allowanceType'],
            unique: true,
            name: 'unique_allowance_type_per_company'
        }
    ]
});

// Junction table for Employee-Allowance many-to-many relationship
const EmployeeAllowance = sequelize.define('EmployeeAllowance', {
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
    allowanceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Allowance,
            key: 'id'
        }
    },
    effectiveDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    customAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    customPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active'
    }
}, {
    timestamps: true,
    indexes: [
        {
            fields: ['employeeId', 'allowanceId', 'effectiveDate'],
            unique: true,
            name: 'unique_employee_allowance_date'
        }
    ],
    hooks: {
        beforeCreate: async (employeeAllowance) => {
            await calculateAllowanceAmount(employeeAllowance);
        },
        beforeUpdate: async (employeeAllowance) => {
            if (employeeAllowance.changed('customPercentage') || employeeAllowance.changed('employeeId') || employeeAllowance.changed('allowanceId')) {
                await calculateAllowanceAmount(employeeAllowance);
            }
        }
    }
});

async function calculateAllowanceAmount(employeeAllowance) {
    const allowance = await Allowance.findByPk(employeeAllowance.allowanceId);
    const employee = await Employee.findByPk(employeeAllowance.employeeId);

    if (allowance && employee && allowance.calculationMethod === 'percentage' && employeeAllowance.customPercentage !== null && employeeAllowance.customPercentage !== undefined) {
        employeeAllowance.calculatedAmount = (employee.basicSalary * (employeeAllowance.customPercentage / 100));
    } else if (allowance && allowance.calculationMethod === 'fixed_amount' && employeeAllowance.customAmount !== null && employeeAllowance.customAmount !== undefined) {
        employeeAllowance.calculatedAmount = employeeAllowance.customAmount;
    } else {
        employeeAllowance.calculatedAmount = null; 
    }
}

module.exports = { Allowance, EmployeeAllowance };






