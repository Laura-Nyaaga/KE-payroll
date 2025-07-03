const { DataTypes, sequelize } = require('../config/db');
const Company = require('./companyModel');

const Region = sequelize.define('Region', {
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
                msg: 'Region name must be between 2-100 characters'
            },
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
            fields: ['name', 'companyId'],
            name: 'unique_region_name_per_company'
        }
    ]
});


module.exports = Region;