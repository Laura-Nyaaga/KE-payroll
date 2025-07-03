const { DataTypes, sequelize } = require("../config/db");
const Employee = require("./employeesModel");
const Company = require("./companyModel");
const User = require("./userModel");

const Payroll = sequelize.define(
  "Payroll",
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
    },
    payPeriodStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        notEmpty: true,
      },
    },
    payPeriodEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        notEmpty: true,
        isAfterStartDate(value) {
          if (new Date(value) <= new Date(this.payPeriodStartDate)) {
            throw new Error("End date must be after start date");
          }
        },
        async validateTotalDays() {
          const startDate = new Date(this.payPeriodStartDate);
          const endDate = new Date(this.payPeriodEndDate);
          const timeDifference = Math.abs(
            endDate.getTime() - startDate.getTime()
          );
          const totalDays = Math.ceil(timeDifference / (1000 * 3600 * 24)) + 1; // Adding 1 to include both start and end dates
          if (totalDays < 25 || totalDays > 30) {
            throw new Error(
              "The total number of days in the pay period must be between 25 and 30 days."
            );
          }
        },
      },
    },
    totalDays: {
      type: DataTypes.VIRTUAL,
      get() {
        if (this.payPeriodStartDate && this.payPeriodEndDate) {
          const startDate = new Date(this.payPeriodStartDate);
          const endDate = new Date(this.payPeriodEndDate);
          const timeDifference = Math.abs(
            endDate.getTime() - startDate.getTime()
          );
          return Math.ceil(timeDifference / (1000 * 3600 * 24)) + 1;
        }
        return null;
      },
      set(value) {
        throw new Error("The totalDays field is read-only.");
      },
    },
    paymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        isAfterEndDate(value) {
          if (value && new Date(value) < new Date(this.payPeriodEndDate)) {
            throw new Error("Payment date cannot be before pay period end");
          }
        },
      },
    },
    // payrollStatus: {
    //   type: DataTypes.ENUM(
    //     "draft",
    //     "pending",
    //     "processed",
    //     "rejected",
    //     "expired"
    //   ),
    //   defaultValue: "draft",
    //   allowNull: false,
    // },
    processedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      references: {
        model: User,
        key: "id",
      },
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: "id",
      },
    },
    rejectedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: "id",
        },
        },
        
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    payrollData: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    summaryData: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    paranoid: true,
    indexes: [
      {
        fields: ["companyId", "payPeriodStartDate", "payPeriodEndDate"],
        unique: true,
        name: "unique_payroll_batch_per_company",
      },
    ],
    // hooks: {
    //   beforeValidate: (payroll, options) => {
    //     const today = new Date();
    //     const currentMonth = today.getMonth(); // 0-based
    //     const currentYear = today.getFullYear();

    //     const start = new Date(payroll.payPeriodStartDate);
    //     const end = new Date(payroll.payPeriodEndDate);
    //     const payment = new Date(payroll.paymentDate);

    //     const startMonth = start.getMonth();
    //     const startYear = start.getFullYear();

    //     // Convert to YYYYMM for easy comparison
    //     const startValue = startYear * 12 + startMonth;
    //     const currentValue = currentYear * 12 + currentMonth;

    //     if (startValue > currentValue) {
    //       throw new Error("You cannot process payroll for a future month.");
    //     }

    //     if (startValue < currentValue - 3) {
    //       throw new Error(
    //         "You can only process payroll up to 3 months in the past."
    //       );
    //     }

    //     // End date must be after start date
    //     if (end <= start) {
    //       throw new Error("End date must be after start date.");
    //     }

    //     // Payment date must be after end date and not more than 7 days from end date
    //     const maxPaymentDate = new Date(end);
    //     maxPaymentDate.setDate(maxPaymentDate.getDate() + 7);

    //     if (payment < end || payment > maxPaymentDate) {
    //       throw new Error(
    //         "Payment date must be after pay period end and within 7 days of start."
    //       );
    //     }

    //     const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    //     if (totalDays < 25 || totalDays > 30) {
    //       throw new Error("Pay period must be between 25 and 30 days.");
    //     }
    //   },
    // },
  }
);

// Payroll Items (Detailed breakdown)
const PayrollItem = sequelize.define(
  "PayrollItem",
  {
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
        key: "id",
      },
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Employee,
        key: "id",
      },
    },
    payrollStatus: { 
      type: DataTypes.ENUM(
        "draft",
        "pending",
        "processed",
        "rejected",
        "expired"
      ),
      defaultValue: "draft",
      allowNull: false,
    },
    itemType: {
      type: DataTypes.ENUM(
        "basic_salary",
        "allowance",
        "deduction",
        "earning",
        "statutory"
      ),
      allowNull: false,
    },
    itemName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    isTaxable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    calculationMethod: {
      type: DataTypes.ENUM("fixed", "percentage", "hourly", "daily"),
      allowNull: true,
    },
    calculationBase: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    processingDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approvalDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
   rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    paranoid: true,
    deletedAt: "deletedAt",
    indexes: [
      { fields: ["payrollId", "employeeId"] },
      { fields: ["itemType"] },
    ],
  }
);

module.exports = { Payroll, PayrollItem };
