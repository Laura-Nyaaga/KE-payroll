const { DataTypes, sequelize } = require('../config/db');
const Employee = require('./employeesModel');

const AdvancePay = sequelize.define('AdvancePay', {
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
            key: 'id',
        },
    },
    advanceAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: {
                args: [0.01],
                msg: 'Advance amount must be greater than 0'
            }
        }
    },
    noOfInstallments: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: {
                args: [1],
                msg: 'Number of installments must be at least 1'
            }
        }
    },
    installmentAmount: {
        type: DataTypes.DECIMAL(10, 2),
    },
    amountPaid: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        validate: {
            min: {
                args: [0],
                msg: 'Amount paid cannot be negative'
            }
        }
    },
    balance: {
        type: DataTypes.DECIMAL(10, 2),
    },
    transactionDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    referenceNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true, 
    },
    status: {
        type: DataTypes.ENUM('Partially Paid', 'Paid', 'Not Paid'),
        defaultValue: 'Not Paid',
    },
    notes: {
        type: DataTypes.TEXT,
    },
    createdAt: {
        type: DataTypes.DATE,
    },
    updatedAt: {
        type: DataTypes.DATE,
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    }
}, {
    hooks: {
        beforeCreate: (advance) => {
            calculateAdvanceDetails(advance);
            // Generate a unique reference number
            const timestamp = Date.now().toString(36);
            const randomString = Math.random().toString(36).substring(2, 8);
            advance.referenceNumber = `ADV-${timestamp}-${randomString.toUpperCase()}`;
        },
        beforeUpdate: (advance) => {
            if (advance.changed('advanceAmount') || advance.changed('noOfInstallments') || advance.changed('amountPaid')) {
                calculateAdvanceDetails(advance);
            }
            // Prevent updating the reference number after creation
            if (advance.changed('referenceNumber') && advance.isNewRecord === false) {
                throw new Error('Reference number cannot be updated after creation.');
            }
        }
    }
});

function calculateAdvanceDetails(advance) {
    // Calculate installment amount
    advance.installmentAmount = advance.advanceAmount / advance.noOfInstallments;
    
    // Calculate balance
    advance.balance = advance.advanceAmount - (advance.amountPaid || 0);
    
    // Update status based on payments
    if (advance.balance <= 0) {
        advance.status = 'Paid';
    } else if (advance.amountPaid > 0) {
        advance.status = 'Partially Paid';
    } else {
        advance.status = 'Not Paid';
    }
}

module.exports = AdvancePay;