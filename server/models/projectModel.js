const { DataTypes, sequelize } = require('../config/db');
const Company = require('./companyModel');
// const Employee = require('./employeesModel');

const Project = sequelize.define('Project', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: {
                args: [2, 100],
                msg: 'Project name must be between 2-100 characters'
            },
        }
    },
    projectCode: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: {
                args: [2, 10],
                msg: 'Project code must be between 2-10 characters'
            },
            isAlphanumeric: {
                msg: 'Project code must be alphanumeric'
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
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    companyId: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Company,
            key: 'id',
        },
    },
    // inchargeId: {  
    //     type: DataTypes.INTEGER,
    //     allowNull: true,
    //     references: {
    //         model: 'Employee',
    //         key: 'id',
    //     },
    // },
    status: { 
        type: DataTypes.ENUM('active', 'inactive', 'completed', 'ongoing', 'cancelled', 'pending'),
        defaultValue: 'active',
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
            fields: ['name', 'companyId'],
            name: 'unique_project_name_per_company'
        },
        {
            unique: true,
            fields: ['projectCode', 'companyId'],
            name: 'unique_project_code_per_company'
        }
    ]
});

module.exports = Project;