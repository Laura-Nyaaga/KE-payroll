const { DataTypes, sequelize } = require('../config/db');
const Company = require('./companyModel');

const User = sequelize.define('User', {
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
            notEmpty: {
                msg: 'Company ID cannot be empty'
            }
        }
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'First name cannot be empty'
            },
            len: {
                args: [2, 50],
                msg: 'First name must be between 2 and 50 characters'
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
                msg: 'Last name cannot be empty'
            },
            len: {
                args: [2, 50],
                msg: 'Last name must be between 2 and 50 characters'
            }
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: {
                msg: 'Please provide a valid email address'
            },
            notEmpty: {
                msg: 'Email cannot be empty'
            }
        }
    },
    phoneNumber: {
        type: DataTypes.STRING,
        validate: {
            is: {
                args: /^\+?[\d\s-]+$/,
                msg: 'Please provide a valid phone number'
            }
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Password cannot be empty'
            },
            len: {
                args: [8, 100],
                msg: 'Password must be between 8 and 100 characters'
            }
        }
    },
    role: {
        type: DataTypes.ENUM(
            'SuperAdmin',    // Full system access and user management
            'HrAdmin',      // HR with admin privileges (can manage HR staff)
            'Hr',           // Regular HR staff
            'Accountant',   // Finance and payroll
            'Manager' // Oversees accounting team
        ),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Role cannot be empty'
            },
            isIn: {
                args: [['SuperAdmin', 'HrAdmin', 'Hr', 'Accountant', 'Manager']],
                msg: 'Invalid user role specified'
        }

        }
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
        allowNull: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    }
}, {
    timestamps: true,
    paranoid: true,
    // defaultScope: {
    //     attributes: { exclude: ['createdAt'] } // Never return password by default
    // }
});

module.exports = User;





// const { DataTypes, sequelize } = require('../config/db');
// const Company = require('./companyModel'); // Import the Company model

// const User = sequelize.define('User', {
//     id: {
//         type: DataTypes.INTEGER,
//         primaryKey: true,
//         autoIncrement: true,
//     },
//     companyId: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         references: {
//             model: Company,
//             key: 'id',
//         },
//     },
//     firstName: {
//         type: DataTypes.STRING,
//         allowNull: false,
//     },
//     middleName: {
//         type: DataTypes.STRING,
//     },
//     lastName: {
//         type: DataTypes.STRING,
//         allowNull: false,
//     },
//     email: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         unique: true,
//         validate: {
//             isEmail: true,
//         },
//     },
//     phoneNumber: {
//         type: DataTypes.STRING,
//     },
//     password: {
//         type: DataTypes.STRING,
//         allowNull: false,
//     },
//     role: {
//         type: DataTypes.ENUM('Admin', 'Hr', 'Accountant', 'Manager'),
//         allowNull: false,
//     },
//     createdAt: {
//         type: DataTypes.DATE,
//     },
//     updatedAt: {
//         type: DataTypes.DATE,
//     },
//     deletedAt: {
//         type: DataTypes.DATE,
//         allowNull: true,
//         defaultValue: null,
//     },
// });

// module.exports = User;