const {
  Employee,
  User,
  Company,
  JobTitle,
  Department,
  Project,
  Region,
} = require("../models");
const { Op } = require("sequelize");

exports.createEmployee = async (req, res) => {
  try {
    const { companyId, reportingToId } = req.body;
    console.log("Request Body:", req.body.basicSalary);

    // Normalize fields
    [
      "personalEmail",
      "passportNo",
      "workPhone",
      "personalPhone",
      "mobileNumber",
      "endDate",
      "passportPhoto",
      "projectId",
      "departmentId",
      "jobTitleId",
      "regionId",
      "nationalId",
      "passportNo"
    ].forEach((field) => {
      if (req.body[field] === "") {
        req.body[field] = null;
      }
    });

    // Optional: strip whitespace from emails
    if (req.body.personalEmail) {
      req.body.personalEmail = req.body.personalEmail.trim();
    }

    if (!companyId) {
      return res.status(400).json({ message: "Company ID is required" });
    }
    if (
      reportingToId !== null &&
      reportingToId !== undefined &&
      reportingToId !== ""
    ) {
      const manager = await Employee.findByPk(reportingToId);
      if (!manager) {
        return res
          .status(400)
          .json({ message: "The specified manager does not exist" });
      }
    }

    // Set createdByUserId (using optional chaining and fallback)
    req.body.createdByUserId = req.user?.id || 1;

    // Ensure reportingToId is properly set to null if not provided
    req.body.reportingToId = reportingToId || null;

    console.log("Passport Photo:", req.body.passportPhoto);


    const newEmployee = await Employee.create(req.body);
    res.status(201).json(newEmployee);
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).json({
      message: "Failed to create employee",
      errors: error.errors
        ? error.errors.map((e) => e.message)
        : [error.message],
    });
  }
};

// Get All Employees (Optional: Filter by companyId as query param)
exports.getAllEmployees = async (req, res) => {
  try {
    const { companyId } = req.query;
    const whereClause = companyId ? { companyId } : {};
    // const employees = await Employee.findAll()
    const employees = await Employee.findAll({
      where: whereClause,
      attributes: [
        "id",
        "firstName",
        "middleName",
        "lastName",
        "workEmail",
        "gender",
        "dateOfBirth",
        "staffNo",
        "status",
        "paymentMethod",
        "accountName",
        "accountNumber",
        "bankName",
        "mobileNumber",
        "nationalId",
        "passportNo",
        "maritalStatus",
        "residentialStatus",
        "jobTitleId",
        "departmentId",
        "companyId",
        "projectId",
        "employmentType",
        "basicSalary",
        "reportingToId",
        "createdByUserId",
      ],
      include: [
        {
          model: User,
          as: "createdBy",
          attributes: ["id", "firstName", "lastName"],
        },
        {
          model: Company,
          as: "company",
          attributes: ["id", "name"],
        },
        {
          model: JobTitle,
          as: "jobTitle",
          attributes: ["id", "name"],
        },
        {
          model: Department,
          as: "department",
          attributes: ["id", "title"],
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "name"],
        },
        {
          model: Employee,
          as: "reportsTo",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
    });
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch employees", error: error.message });
  }
};

// Get All Employees in a Particular Company
exports.getEmployeesByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    if (!companyId) {
      return res.status(400).json({ message: "Company ID is required" });
    }
    const employees = await Employee.findAll({
      where: { companyId },
      attributes: {
        exclude: ["employeeId"],
      },
      include: [
        {
          model: User,
          as: "createdBy",
          attributes: ["id", "firstName", "lastName"],
        },
        { model: Company, as: "company", attributes: ["id", "name"] },
        { model: JobTitle, as: "jobTitle", attributes: ["id", "name"] },
        { model: Department, as: "department", attributes: ["id", "title"] },
        { model: Project, as: "project", attributes: ["id", "name"] },
        {
          model: Employee,
          as: "reportsTo",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
    });
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees by company:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch employees by company",
        error: error.message,
      });
  }
};

// Filter Employees Details in a Specific Company
exports.filterEmployees = async (req, res) => {
  try {
    const { companyId } = req.params;
    if (!companyId) {
      return res.status(400).json({ message: "Company ID is required" });
    }
    const {
      jobTitle,
      department,
      employmentType,
      paymentMethod,
      createdBy,
      project,
    } = req.query;
    const whereClause = { companyId, deletedAt: null };

    if (jobTitle) whereClause.jobTitleId = jobTitle;
    if (department) whereClause.departmentId = department;
    if (employmentType) whereClause.employmentType = employmentType;
    if (paymentMethod) whereClause.paymentMethod = paymentMethod;
    if (createdBy) whereClause.createdByUserId = createdBy;
    if (project) whereClause.projectId = project;

    const employees = await Employee.findAll({
      where: whereClause,
      attributes: {
        exclude: ["employeeId"],
      },
      include: [
        {
          model: User,
          as: "createdBy",
          attributes: ["id", "firstName", "lastName"],
        },
        { model: Company, as: "company", attributes: ["id", "name"] },
        { model: JobTitle, as: "jobTitle", attributes: ["id", "name"] },
        { model: Department, as: "department", attributes: ["id", "title"] },
        { model: Project, as: "project", attributes: ["id", "name"] },
        {
          model: Employee,
          as: "reportsTo",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
    });
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error filtering employees:", error);
    res
      .status(500)
      .json({ message: "Failed to filter employees", error: error.message });
  }
};

// Edit Employee Details
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      employeeId, // Should be ignored
      accumulatedLeaveDays, // Should be ignored
      companyId, // Should be ignored
      updatedAt, // Should be ignored
      createdAt, // Should be ignored
      ...updateData
    } = req.body;

    // if (reportingToId) {
    //     const manager = await Employee.findByPk(reportingToId);
    //     if (!manager) {
    //         return res.status(400).json({ message: 'The specified manager does not exist' });
    //     }

    //     // Prevent circular references
    //     if (Number(reportingToId) === Number(id)) {
    //         return res.status(400).json({ message: 'An employee cannot report to themselves' });
    //     }
    // }

    const [updatedRows] = await Employee.update(updateData, {
      where: { id, deletedAt: null },
    });

    if (updatedRows === 0) {
      return res
        .status(404)
        .json({ message: "Employee not found or already deleted" });
    }

    const updatedEmployee = await Employee.findByPk(id, {
      include: [
        {
          model: User,
          as: "createdBy",
          attributes: ["id", "firstName", "lastName"],
        },
        { model: Company, as: "company", attributes: ["id", "name"] },
        { model: JobTitle, as: "jobTitle", attributes: ["id", "name"] },
        { model: Department, as: "department", attributes: ["id", "title"] },
        { model: Project, as: "project", attributes: ["id", "name"] },
        {
          model: Employee,
          as: "reportsTo",
          attributes: ["firstName", "lastName"],
          foreignKey: "reportingToId",
          targetKey: "id",
        },
      ],
    });
    res.status(200).json(updatedEmployee);
  } catch (error) {
    console.error("Error updating employee:", error);
    res
      .status(500)
      .json({
        message: "Failed to update employee",
        errors: error.errors
          ? error.errors.map((e) => e.message)
          : [error.message],
      });
  }
};

// Soft Delete Employee
exports.softDeleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const [updatedRows] = await Employee.update(
      { deletedAt: new Date() },
      {
        where: { id },
        attributes: {
          exclude: ["employeeId"], // Exclude employeeId from the update
        },
      }
    );
    if (updatedRows === 0) {
      return res
        .status(404)
        .json({ message: "Employee not found or already deleted" });
    }
    if (!id) {
      return res.status(400).json({ message: "Employee ID is required" });
    }
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    if (employee.deletedAt) {
      return res.status(400).json({ message: "Employee already deleted" });
    }
    await employee.destroy();
    res.status(200).json({ message: "Employee soft deleted successfully" });
  } catch (error) {
    console.error("Error soft deleting employee:", error);
    res
      .status(500)
      .json({
        message: "Failed to soft delete employee",
        errors: error.errors
          ? error.errors.map((e) => e.message)
          : [error.message],
      });
  }
};

// Search Employee by Name or Staff No
exports.searchEmployee = async (req, res) => {
  try {
    const { companyId } = req.query;
    const { query } = req.query;

    if (!companyId) {
      return res
        .status(400)
        .json({ message: "Company ID is required for search" });
    }
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const employees = await Employee.findAll({
      where: {
        companyId,
        deletedAt: null,
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${query}%` } },
          { middleName: { [Op.iLike]: `%${query}%` } },
          { lastName: { [Op.iLike]: `%${query}%` } },
          { staffNo: { [Op.iLike]: `%${query}%` } },
        ],
      },
      include: [
        {
          model: User,
          as: "createdBy",
          attributes: ["id", "firstName", "lastName"],
        },
        { model: Company, as: "company", attributes: ["id", "companyName"] },
        { model: JobTitle, as: "jobTitle", attributes: ["id", "title"] },
        { model: Department, as: "department", attributes: ["id", "name"] },
        { model: Project, as: "project", attributes: ["id", "name"] },
        {
          model: Employee,
          as: "reportsTo",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
    });
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error searching employees:", error);
    res
      .status(500)
      .json({ message: "Failed to search employees", error: error.message });
  }
};

// Get All Employee Related Details in Table Format
exports.getAllEmployeeDetails = async (req, res) => {
  try {
    const { companyId } = req.query;
    const whereClause = companyId
      ? { companyId, deletedAt: null }
      : { deletedAt: null };
    const Employee = require("../models/employeesModel");
    const User = require("../models/userModel");
    const Company = require("../models/companyModel");
    const JobTitle = require("../models/jobTitleModel");
    const Department = require("../models/departmentModel");
    const Project = require("../models/projectModel");
    const Region = require("../models/regionModel");
    const { Earnings, EmployeeEarnings } = require("../models/earningsModel");
    const { Deduction } = require("../models/deductionsModel");
    const {
      Allowance,
      EmployeeAllowance,
    } = require("../models/allowancesModel");
    const employees = await Employee.findAll({
      where: whereClause,
      subQuery: false,
      attributes: {
        exclude: ["employeeId"],
      },
      include: [
        {
          model: User,
          as: "createdBy",
          attributes: ["id", "firstName", "lastName"],
        },
        {
          model: Company,
          as: "company",
          attributes: ["id", "name"],
        },
        {
          model: JobTitle,
          as: "jobTitle",
          attributes: ["id", "name"],
        },
        {
          model: Department,
          as: "department",
          attributes: ["id", "title"],
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "name"],
        },
        { model: Region, as: "region", attributes: ["id", "name"] },

        {
          model: Employee,
          as: "reportsTo",
          attributes: ["id", "firstName", "lastName"],
        },
        {
          model: EmployeeEarnings,
          as: "employeeEarnings",
          attributes: ["calculatedAmount", "earningsId"],
          include: [
            {
              model: Earnings,
              as: "earnings",
            },
          ],
        },
        {
          model: EmployeeAllowance,
          as: "employeeAllowances",
          attributes: ["calculatedAmount", "allowanceId"],
          include: [
            {
              model: Allowance,
              as: "allowance",
            },
          ],
        },
        {
          model: Deduction,
          as: "deductions",
          through: {
            attributes: ["calculatedAmount", "deductionId"],
          },
        },
      ],
    });
    const formattedDetails = employees.map((employee) => {
      const base = {
        employeeId: employee.id,
        firstName: employee.firstName,
        middleName: employee.middleName,
        lastName: employee.lastName,
        staffNo: employee.staffNo,
        workEmail: employee.workEmail,
        gender: employee.gender,
        dateOfBirth: employee.dateOfBirth,
        nationalId: employee.nationalId,
        passportNo: employee.passportNo,
        maritalStatus: employee.maritalStatus,
        residentialStatus: employee.residentialStatus,
        jobTitle: employee.jobTitle ? employee.jobTitle.name : null,
        department: employee.department ? employee.department.title : null,
        project: employee.project ? employee.project.name : null,
        employmentType: employee.employmentType,
        status: employee.status,
        paymentMethod: employee.paymentMethod,
        accountName: employee.accountName,
        accountNumber: employee.accountNumber,
        bankName: employee.bankName,
        mobileNumber: employee.mobileNumber,
        calculatedMonthlyPay: employee.calculatedMonthlyPay,
        reportingTo: employee.reportsTo
          ? `${employee.reportsTo.firstName} ${employee.reportsTo.lastName}`
          : null,
      };
      const earnings = employee.employeeEarnings
        ? employee.employeeEarnings.map((ee) => ({
            customAmount: ee.earnings?.customAmount || ee.customAmount,
            earningsAmount: ee.calculatedAmount,
          }))
        : [];
      // Access deductions through the many-to-many relationship
      const deductions = employee.deductions
        ? employee.deductions.map((deduction) => {
            // Get junction table data from 'EmployeeDeduction'
            const junctionData = deduction.EmployeeDeduction;
            return {
              customAmount: deduction.customAmount,
              deductionAmount: junctionData ? junctionData.calculatedAmount : 0,
            };
          })
        : [];
      const allowances = employee.employeeAllowances
        ? employee.employeeAllowances.map((ea) => ({
            customAmount: ea.allowance?.customAmount || ea.customAmount,
            allowanceAmount: ea.calculatedAmount,
          }))
        : [];
      return { ...base, earnings, deductions, allowances };
    });
    res.status(200).json(formattedDetails);
  } catch (error) {
    console.error("Error fetching all employee details:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch all employee details",
        error: error.message,
      });
  }
};

exports.getEmployeeById = async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await Employee.findByPk(id, {
      attributes: {
        exclude: ["employeeId"],
      },
      include: [
        {
          model: User,
          as: "createdBy",
          attributes: ["id", "firstName", "lastName"],
        },
        { model: Company, as: "company", attributes: ["id", "name"] },
        { model: JobTitle, as: "jobTitle", attributes: ["id", "name"] },
        { model: Department, as: "department", attributes: ["id", "title"] },
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: Region, as: "region", attributes: ["id", "name"] },
        {
          model: Employee,
          as: "reportsTo",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error("Error fetching employee by ID:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch employee", error: error.message });
  }
};
