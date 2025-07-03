const { DataTypes, sequelize } = require("../config/db");
const Company = require("./companyModel");

const User = sequelize.define(
  "User",
  {
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
        key: "id",
      },
      validate: {
        notEmpty: {
          msg: "Company ID cannot be empty",
        },
      },
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "First name cannot be empty",
        },
        len: {
          args: [2, 50],
          msg: "First name must be between 2 and 50 characters",
        },
      },
    },
    middleName: {
      type: DataTypes.STRING,
      validate: {
        len: {
          args: [0, 50],
          msg: "Middle name must be less than 50 characters",
        },
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Last name cannot be empty",
        },
        len: {
          args: [2, 50],
          msg: "Last name must be between 2 and 50 characters",
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: {
          msg: "Please provide a valid email address",
        },
        notEmpty: {
          msg: "Email cannot be empty",
        },
      },
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: {
          args: /^\+?[\d\s-]+$/,
          msg: "Please provide a valid phone number",
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Password cannot be empty",
        },
        len: {
          args: [8, 100],
          msg: "Password must be between 8 and 100 characters",
        },
      },
    },
    role: {
      type: DataTypes.ENUM(
        "SuperAdmin", // Full system access and user management
        "HrAdmin", // HR with admin privileges (can manage HR staff)
        "Hr", // Regular HR staff
        "Accountant", // Finance and payroll
        "Manager" // Oversees accounting team
      ),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Role cannot be empty",
        },
        isIn: {
          args: [["SuperAdmin", "HrAdmin", "Hr", "Accountant", "Manager"]],
          msg: "Invalid user role specified",
        },
      },
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
      allowNull: true,
    },
    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lockUntil: {
      type: DataTypes.DATE, // Stores the time until the account is locked
      allowNull: true,
    },
  resetToken: {
  type: DataTypes.STRING,
  allowNull: true,
},
resetTokenExpiry: {
  type: DataTypes.DATE,
  allowNull: true,
},
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ["companyId", "email"],
        name: "unique_email_per_company",
      },
    ],
  }
);

module.exports = User;
