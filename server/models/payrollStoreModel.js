const { DataTypes, sequelize } = require('../config/db');
const Payroll = require('./payrollModel');
const Company = require('./companyModel');

const PayrollStore = sequelize.define('PayrollStore', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    payrollId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Payroll,
            key: 'id'
        },
        unique: true
    },
    companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Company,
            key: 'id'
        }
    },
    payPeriodStartDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    payPeriodEndDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    paymentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    processedBy: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    payrollData: {
        type: DataTypes.JSON,
        allowNull: false
    },
    summaryData: {
        type: DataTypes.JSON,
        allowNull: false
    },
    statutoryConfigVersion: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Version of statutory calculations used'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    indexes: [
        {
            fields: ['companyId', 'payPeriodStartDate', 'payPeriodEndDate'],
            name: 'payroll_store_period_index'
        },
        {
            fields: ['companyId'],
            name: 'payroll_store_company_index'
        }
    ]
});

module.exports = PayrollStore;