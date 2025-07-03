const { DataTypes, sequelize } = require('../config/db');
const Company = require('./companyModel');

const Department = sequelize.define('Department', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: {
                args: [2, 100],
                msg: 'Department title must be between 2-100 characters'
            },
        }
    },
    departmentCode: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: {
                args: [2, 10],
                msg: 'Department code must be between 2-10 characters'
            },
            isAlphanumeric: {
                msg: 'Department code must be alphanumeric'
            }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: {
                args: [0, 500],
                msg: 'Description must be less than 500 characters'
            }
        }
    },
    companyId: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Company,
            key: 'id',
        },
    },
    status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',
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
}, {
    indexes: [
        {
            unique: true,
            fields: ['title', 'companyId'],
            name: 'unique_department_title_per_company'
        },
        {
            unique: true,
            fields: ['departmentCode', 'companyId'],
            name: 'unique_department_code_per_company'
        }
    ]
});


module.exports = Department;