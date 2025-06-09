const { DataTypes, sequelize } = require('../config/db');

const Company = sequelize.define('Company', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
            msg: 'This company name is already in use'
        },
        validate: {
            notEmpty: {
                msg: 'Company name cannot be empty'
            },
            len: {
                args: [2, 100],
                msg: 'Company name must be between 2 and 100 characters'
            },
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
    registrationNo: {
        type: DataTypes.STRING,
       unique: true,
        validate: {
            notEmpty: {
                msg: 'Registration number cannot be empty'
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
    address: {
        type: DataTypes.STRING,
        validate: {
            notEmpty: {
                msg: 'Address cannot be empty'
            }
        }
    },
    industryCategory: {
        type: DataTypes.STRING,
        validate: {
            notEmpty: {
                msg: 'Industry category cannot be empty'
            }
        }
    },
    website: {
        type: DataTypes.STRING,
        validate: {
            isUrl: {
                msg: 'Please provide a valid website URL'
            }
        }
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'KES',
        validate: {
            isIn: {
                args: [['KES', 'USD', 'EUR', 'GBP']],
                msg: 'Please select a valid currency'
            }
        }
    },
    kraPin: {
        type: DataTypes.STRING,
        unique: {
            msg: 'This KRA PIN is already in use'
        },
        validate: {
            notEmpty: {
                msg: 'KRA PIN cannot be empty'
            },
            is: {
                args: /^[A-Z][0-9]{9}[A-Z]$/,
                msg: 'KRA PIN must be 11 characters: first and last must be uppercase letters, with 9 digits in between'
            },
            len: {
                args: [11, 11],
                msg: 'KRA PIN must be exactly 11 characters long'
            }
        }
    },
    bankName: {
        type: DataTypes.STRING,
        validate: {
            notEmpty: {
                msg: 'Bank name cannot be empty'
            }
        }
    },
    branchName: {
        type: DataTypes.STRING,
        validate: {
            notEmpty: {
                msg: 'Branch name cannot be empty'
            }
        }
    },
    accountNumber: {
        type: DataTypes.STRING,
        validate: {
            notEmpty: {
                msg: 'Account number cannot be empty'
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
    companyLogo: {
        type: DataTypes.STRING,
        validate: {
            isUrl: {
                msg: 'Please provide a valid URL for company logo'
            }
        }
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
    defaultScope: {
        attributes: { exclude: ['password'] } // Never return password by default
    },
    hooks: {
                beforeValidate: (company) => {
                    if (company.name) {
                        company.name = company.name
                            .toLowerCase()
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                    }
                }
            }
});

module.exports = Company;

