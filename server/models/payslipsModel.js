const { DataTypes, sequelize } = require('../config/db');
const Employee = require('./employeesModel');
const Payroll = require('./payrollModel');

const Payslip = sequelize.define('Payslip', {
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
    payrollId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Payroll,
            key: 'id',
        },
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'Disapproved'),
        allowNull: false,
        defaultValue: 'pending',
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
    },
});
module.exports = Payslip;