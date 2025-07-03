const { DataTypes, sequelize } = require('../config/db');
const Company = require('./companyModel');

const JobTitle = sequelize.define('JobTitle', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        // Removed global unique constraint
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: {
                args: [0, 500],
                msg: 'Description must be less than 500 characters',
            },
        },
    },
    status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active',
    },
    companyId: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Company,
            key: 'id',
        },
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
            name: 'unique_jobtitle_name_per_company'
        }
    ],
});


module.exports = JobTitle;