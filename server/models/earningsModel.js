const { DataTypes, sequelize } = require("../config/db");
const Company = require("./companyModel");
const Employee = require("./employeesModel");

const Earnings = sequelize.define(
  "Earnings",
  {
    id: { type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Company, key: "id" },
      validate: {
        notNull: { msg: "Company ID is required" },
      },
    },
    earningsType: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: "Earnings type is required" },
        len: {
          args: [2, 100],
          msg: "Earnings type must be between 2-100 characters",
        },
      },
    },
    calculationMethod: {
      type: DataTypes.ENUM("fixed_amount", "percentage"),
      allowNull: false,
      defaultValue: "fixed_amount",
    },
    isTaxable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    mode: {
      type: DataTypes.ENUM("monthly", "hourly", "daily", "weekly"),
      allowNull: false,
      defaultValue: "monthly",
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
    createdAt: { 
      type: DataTypes.DATE, 
      defaultValue: 
      DataTypes.NOW 
    },
    updatedAt: { 
      type: DataTypes.DATE, 
      defaultValue: 
      DataTypes.NOW 
    },
    deletedAt: { 
      type: DataTypes.DATE, 
      allowNull: true 
    },
  },
  {
    paranoid: true,
    validate: {
      modeMatchesCalculationMethod() {
        if (
          this.calculationMethod === "percentage" &&
          this.mode !== "monthly"
        ) {
          throw new Error(
            'Percentage-based earnings must have "monthly" mode.'
          );
        }
      },
    },
    indexes: [
      {
        fields: ["companyId", "earningsType"],
        unique: true,
        name: "unique_earnings_type_per_company",
      },
    ],
  }
);

const EmployeeEarnings = sequelize.define(
  "EmployeeEarnings",
  {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { 
        model: Employee, 
        key: "id" 
      },
    },
    earningsId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { 
        model: Earnings, 
        key: "id" 
      },
    },
    effectiveDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      validate: {
        isAfter: {
          args: [new Date().toISOString().split("T")[0]],
          msg: "Effective date must be after the current date.",
          },
    },
    },
    endDate: { 
      type: DataTypes.DATEONLY, 
      allowNull: true,
      validate: {
        isAfter: {
          args: [new Date().toISOString().split("T")[0]],
          msg: "End date must be after the current date.",
        },
      },
  },
    customPercentage: { 
      type: DataTypes.DECIMAL(5, 2), 
      allowNull: true 
    },
    customMonthlyAmount: { 
      type: DataTypes.DECIMAL(10, 2), 
      allowNull: true 
    },
    customNumberOfHours: { 
      type: DataTypes.DECIMAL(5, 2), 
      allowNull: true 
    },
    customHourlyRate: { 
      type: DataTypes.DECIMAL(10, 2), 
      allowNull: true 
    },
    customNumberOfWeeks: { 
      type: DataTypes.DECIMAL(10, 2), 
      allowNull: true 
    },
    customWeeklyRate: { 
      type: DataTypes.DECIMAL(10, 2), 
      allowNull: true 
    },
    customNumberOfDays: { 
      type: DataTypes.DECIMAL(10, 2), 
      allowNull: true 
    },
    customDailyRate: { 
      type: DataTypes.DECIMAL(10, 2), 
      allowNull: true 
    },  
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
    calculatedAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ["employeeId", "earningsId", "effectiveDate"],
        unique: true,
        name: "unique_employee_earnings_date",
      },
    ],
    hooks: {
      beforeCreate: async (employeeEarnings) => {
        await calculateEarningsAmount(employeeEarnings);
        // await employeeEarnings.save();
      },
      beforeUpdate: async (employeeEarnings) => {
        const relevantFields = [
          "customMonthlyAmount",
          "customPercentage",
          "customNumberOfHours",
          "customHourlyRate",
          "customNumberOfWeeks",
          "customWeeklyRate",
          "customNumberOfDays",
          "customDailyRate",
        ];
        const changed = relevantFields.some((field) =>
          employeeEarnings.changed(field)
        );
        if (changed) await calculateEarningsAmount(employeeEarnings);
      },
    },
  }
);

async function calculateEarningsAmount(employeeEarnings) {
  const earnings = await Earnings.findByPk(employeeEarnings.earningsId);
  const employee = await Employee.findByPk(employeeEarnings.employeeId);

  if (!earnings || !employee) return;

  const { calculationMethod, mode } = earnings;

  if (calculationMethod === "percentage") {
    if (mode !== "monthly") {
      throw new Error('Percentage-based earnings must have "monthly" mode.');
    }

    if (
      employeeEarnings.customPercentage === null ||
      employeeEarnings.customPercentage === undefined
    ) {
      throw new Error(
        "Custom percentage is required for percentage-based earnings."
      );
    }
    employeeEarnings.calculatedAmount =
      employee.basicSalary * (employeeEarnings.customPercentage / 100);
  } else if (calculationMethod === "fixed_amount") {
    switch (mode) {
      case "monthly":
        if (
          employeeEarnings.customMonthlyAmount === null ||
          employeeEarnings.customMonthlyAmount === undefined
        ) {
          throw new Error(
            "Custom amount is required for monthly fixed earnings."
          );
        }
        employeeEarnings.calculatedAmount =
          employeeEarnings.customMonthlyAmount;
        break;

      case "hourly":
        if (
          employeeEarnings.customNumberOfHours === null ||
          employeeEarnings.customHourlyRate === null
        ) {
          throw new Error(
            "Both custom hours and hourly rate are required for hourly earnings."
          );
        }
        employeeEarnings.calculatedAmount =
          employeeEarnings.customNumberOfHours *
          employeeEarnings.customHourlyRate;
        break;

      case "daily":
        if (
          employeeEarnings.customNumberOfDays === null ||
          employeeEarnings.customDailyRate === null
        ) {
          throw new Error(
            "Both custom days and daily rate are required for daily earnings."
          );
        }
        employeeEarnings.calculatedAmount =
          employeeEarnings.customNumberOfDays *
          employeeEarnings.customDailyRate;
        break;

      case "weekly":
        if (
          employeeEarnings.customNumberOfWeeks === null ||
          employeeEarnings.customWeeklyRate === null
        ) {
          throw new Error(
            "Both custom weeks and weekly rate are required for weekly earnings."
          );
        }
        employeeEarnings.calculatedAmount =
          employeeEarnings.customNumberOfWeeks *
          employeeEarnings.customWeeklyRate;
        break;

      default:
        throw new Error(`Unsupported mode: ${mode}`);
    }
  } else {
    throw new Error(`Unsupported calculation method: ${calculationMethod}`);
  }
}




module.exports = { Earnings, EmployeeEarnings, calculateEarningsAmount };
