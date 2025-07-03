require("dotenv").config();
const { Payroll, PayrollItem } = require("../models/payrollModel");
const { Employee, Company, Department, JobTitle, User } = require("../models");
const { Op, Sequelize } = require("sequelize");
const PayrollCalculationService = require("../utils/payrollCalculationService");
const nodemailer = require("nodemailer");
const archiver = require("archiver");
const fs = require("fs");
const { promises: fsPromises } = require("fs");
const { spawn } = require("child_process");
const { personalRelief } = require("../config/statutoryRates");

class PayrollController {
  constructor() {
    this.sendPayslipsEmail = this.sendPayslipsEmail.bind(this); // Bind the method
    this.downloadPayslipsPDF = this.downloadPayslipsPDF.bind(this); // Bind the method
    this.getEmployeePayslip = this.getEmployeePayslip.bind(this);
    this.getEmployeePayslipData = this.getEmployeePayslipData.bind(this);
  }

  async getPayrollPreview(req, res) {
    const { companyId } = req.params;
    const { payPeriodStartDate, payPeriodEndDate, paymentDate } = req.body;

    console.log("These are the received dates:", {
      payPeriodStartDate,
      payPeriodEndDate,
      paymentDate,
    });

    if (!payPeriodStartDate || !payPeriodEndDate || !paymentDate) {
      return res
        .status(400)
        .json({ message: "Missing payroll period or payment date." });
    }

    try {
      const company = await Company.findByPk(companyId);
      if (!company)
        return res.status(404).json({ message: "Company not found." });

      // Extract year and month from payroll period start date
      const payrollDate = new Date(payPeriodStartDate);
      const payrollMonth = payrollDate.getMonth() + 1;
      const payrollYear = payrollDate.getFullYear();

      // Get current date details
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Calculate the earliest allowed date for payroll processing
      const earliestAllowedDate = new Date();
      earliestAllowedDate.setMonth(currentDate.getMonth() - 3);

      // const earliestAllowedMonth = earliestAllowedDate.getMonth() + 1;
      // const earliestAllowedYear = earliestAllowedDate.getFullYear();

      // Ensure payroll is within the allowed range
      // const isTooOld =
      //   payrollYear < earliestAllowedYear ||
      //   (payrollYear === earliestAllowedYear &&
      //     payrollMonth < earliestAllowedMonth);
      const isFutureMonth =
        payrollYear > currentYear ||
        (payrollYear === currentYear && payrollMonth > currentMonth);

      // if (isTooOld) {
      //   return res.status(400).json({
      //     message: `Payroll for ${payrollDate.toLocaleString("default", {
      //       month: "long",
      //     })},
      //          ${payrollYear} is too far in the past. 
      //         You can only process payroll for the last three months.`,
      //   });
      // }

      if (isFutureMonth) {
        return res.status(400).json({
          message: `Payroll for ${payrollDate.toLocaleString("default", {
            month: "long",
          })}, 
                ${payrollYear} is ahead of the current month. 
                You cannot process payroll for future months.`,
        });
      }

      // Check if a payroll batch already exists in the same month
      const existingPayroll = await Payroll.findOne({
        where: {
          companyId,
          [Op.and]: [
            Sequelize.literal(`MONTH(payPeriodStartDate) = ${payrollMonth}`),
            Sequelize.literal(`YEAR(payPeriodStartDate) = ${payrollYear}`),
          ],
        },
      });

      if (existingPayroll) {
        return res.status(400).json({
          message: `The payroll for ${new Date(
            payPeriodStartDate
          ).toLocaleString("default", {
            month: "long",
          })}, ${payrollYear} already exists. You cannot process payroll more than once in a month.`,
        });
      }

      // Create new payroll batch WITHOUT status field
      const payroll = await Payroll.create({
        companyId,
        payPeriodStartDate,
        payPeriodEndDate,
        paymentDate,
        submittedAt: new Date(),
      });

      console.log("Payroll batch created:", payroll);

      let totalGross = 0;
      let totalNet = 0;
      let totalStatutory = {};

      const employees = await Employee.findAll({
        where: {
          companyId,
          status: "active",
          employmentDate: {
            [Op.lte]: payPeriodEndDate,
          },
        },
      });

      const processedData = [];

      for (const employee of employees) {
        // Compute payroll
        const payrollData =
          await PayrollCalculationService.calculateEmployeePayroll(
            employee,
            { start: payPeriodStartDate, end: payPeriodEndDate },
            company.name
          );

        const allItems = [
          ...payrollData.earnings.map((e) => ({
            itemType: "earning",
            itemName: e.name || "Unknown Earning",
            amount: e.amount,
            isTaxable: e.isTaxable || true,
          })),
          ...payrollData.deductions.map((d) => ({
            itemType: "deduction",
            itemName: d.name || "Unknown Deduction",
            amount: d.amount,
            isTaxable: d.isTaxable || true,
          })),
          ...Object.entries(payrollData.statutory || {})
            .filter(([key]) => key) // Filter out empty keys
            .map(([key, val]) => ({
              itemType: "statutory",
              itemName: key,
              amount: val,
            })),
          {
            itemType: "basic_salary",
            itemName: "Basic Salary",
            amount: employee.basicSalary,
            isTaxable: true,
          },
        ];

        totalGross += payrollData.grossPay || 0;
        totalNet += payrollData.netPaye || 0;

        for (const [key, value] of Object.entries(
          payrollData.statutory || {}
        )) {
          if (!totalStatutory[key]) totalStatutory[key] = 0;
          totalStatutory[key] += value;
        }

        console.log(
          "All items before creation:",
          JSON.stringify(allItems, null, 2)
        );

        // Iterate over allItems and create a PayrollItem for each
        for (const item of allItems) {
          await PayrollItem.create({
            payrollId: payroll.id,
            employeeId: employee.id,
            payrollStatus: "draft", // Status only at employee level
            submittedAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expiry at employee level
            itemType: item.itemType,
            itemName: item.itemName,
            amount: item.amount,
            isTaxable: item.isTaxable || true, // Ensure isTaxable is handled
          });
        }

        processedData.push({
          employeeId: employee.id,
          staffId: employee.staffNo,
          fullName: `${employee.firstName} ${employee.lastName}`,
          basicSalary: employee.basicSalary,
          departmentId: employee.departmentId,
          jobTitleId: employee.jobTitleId,
          projectId: employee.projectId,
          employmentType: employee.employmentType,
          paymentMethod: employee.paymentMethod,
          mobileNumber: employee.mobileNumber,
          accountName: employee.accountName,
          accountNumber: employee.accountNumber,
          bankName: employee.bankName,
          branchName: employee.branchName,
          branchName: employee.branchName,
          branchCode: employee.branchCode,
          grossPay: payrollData.grossPay,
          totalEarnings: payrollData.earnings.reduce(
            (sum, e) => sum + e.amount,
            0
          ),
          totalDeductions: payrollData.deductions.reduce(
            (sum, d) => sum + d.amount,
            0
          ),
          statutory: payrollData.statutory,
          netPay: payrollData.netPaye,
          taxableIncome: payrollData.taxableIncome,
          paymentMethod: employee.paymentMethod,
          payrollStatus: "draft", // Employee-level status
          submittedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Employee-level expiry
        });
      }

      payroll.summaryData = {
        totalGrossPay: totalGross,
        totalNetPay: totalNet,
        totalStatutoryDeductions: totalStatutory,
        totalEmployees: processedData.length,
      };

      await payroll.save();

      const payrollItems = await PayrollItem.findAll({
        where: { payrollId: payroll.id },
      });

      // Calculate status summary
      const statusSummary = {
        draft: processedData.filter((d) => d.payrollStatus === "draft").length,
        approved: 0, // Will be 0 in preview since all are new
        paid: 0, // Will be 0 in preview
        total: processedData.length,
      };

      // Update payroll batch with counters (optional)
      await Payroll.update(
        {
          draftCount: statusSummary.draft,
          approvedCount: statusSummary.appended,
          paidCount: statusSummary.paid,
        },
        { where: { id: payroll.id } }
      );

      return res.status(201).json({
        success: true,
        message: "Payroll preview generated",
        payrollId: payroll.id,
        metadata: {
          companyId,
          payPeriodStartDate,
          payPeriodEndDate,
          paymentDate,
          totalEmployeesProcessed: processedData.length,
        },
        summary: payroll.summaryData,
        statusSummary,
        data: processedData,
        payrollItems: payrollItems,
      });
    } catch (error) {
      console.error("Payroll preview generation failed:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to generate payroll preview",
        error: error.message,
      });
    }
  }

  async submitDraftPayroll(req, res) {
    const { companyId } = req.params;
    const { payrollId, approverId, employeeIds } = req.body;

    // Validate input
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No employees selected for processing.",
      });
    }

    console.log("Received employee IDs:", employeeIds, typeof employeeIds[0]);

    try {
      // 1. Validate payroll exists (removed payrollStatus check since we're tracking at employee level)
      const payroll = await Payroll.findOne({
        where: { id: payrollId, companyId },
      });

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll not found.",
        });
      }

      // Auto expiry for employees date
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      await PayrollItem.update(
        {
          payrollStatus: "expired",
          expiresAt: new Date(),
        },
        {
          where: {
            payrollId,
            payrollStatus: "draft",
            approvalDate: { [Op.lt]: sevenDaysAgo },
          },
        }
      );

      // 2. Get only the selected employees
      const employees = await Employee.findAll({
        where: {
          id: employeeIds,
          companyId,
        },
        attributes: [
          "id",
          "staffNo",
          "firstName",
          "lastName",
          "basicSalary",
          "departmentId",
          "jobTitleId",
          "projectId",
          "employmentType",
          "paymentMethod",
          "mobileNumber",
          "accountName",
          "bankName",
          "branchName",
          "accountNumber",
          "branchCode",
          "branchName",
          "bankCode",
        ],
      });

      if (employees.length !== employeeIds.length) {
        const foundIds = employees.map((e) => e.id);
        const missingIds = employeeIds.filter((id) => !foundIds.includes(id));

        return res.status(404).json({
          success: false,
          message: "Some employees not found.",
          missingEmployeeIds: missingIds,
        });
      }

      // 3. Verify all selected employees exist in PayrollItems and are in draft status
      const existingItems = await PayrollItem.findAll({
        where: {
          payrollId,
          employeeId: { [Op.in]: employeeIds },
          payrollStatus: "draft", // Only consider draft items
          deletedAt: null, // Exclude soft-deleted items
        },
      });

      const existingEmployeeIds = existingItems.map((i) => i.employeeId);
      const uniqueExistingIds = [...new Set(existingEmployeeIds)];

      if (uniqueExistingIds.length !== employeeIds.length) {
        const missingInPayroll = employeeIds.filter(
          (id) => !uniqueExistingIds.includes(id)
        );
        return res.status(400).json({
          success: false,
          message: "Some employees don't have draft payroll records.",
          missingInPayroll,
        });
      }

      // 4. Process only the selected employees
      const processedEmployees = [];
      let totalGross = 0;
      let totalNet = 0;
      let totalStatutory = {};

      // Process in batches for better performance
      const batchSize = 10;
      for (let i = 0; i < employees.length; i += batchSize) {
        const batch = employees.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (employee) => {
            const payrollData =
              await PayrollCalculationService.calculateEmployeePayroll(
                employee,
                {
                  start: payroll.payPeriodStartDate,
                  end: payroll.payPeriodEndDate,
                }
              );

            // Update existing items instead of destroying
            await PayrollItem.update(
              {
                payrollStatus: "pending", // Update status to pending
                expiresAt: null,
              },
              {
                where: {
                  payrollId,
                  employeeId: employee.id,
                },
              }
            );

            // Update totals
            totalGross += payrollData.grossPay;
            totalNet += payrollData.netPaye;

            for (const [key, value] of Object.entries(
              payrollData.statutory || {}
            )) {
              totalStatutory[key] = (totalStatutory[key] || 0) + value;
            }

            processedEmployees.push({
              employeeId: employee.id,
              staffId: employee.staffNo,
              fullName: `${employee.firstName} ${employee.lastName}`,
              basicSalary: employee.basicSalary,
              departmentId: employee.departmentId,
              jobTitleId: employee.jobTitleId,
              projectId: employee.projectId,
              employmentType: employee.employmentType,
              paymentMethod: employee.paymentMethod,
              mobileNumber: employee.mobileNumber,
              accountName: employee.accountName,
              accountNumber: employee.accountNumber,
              bankName: employee.bankName,
              branchName: employee.branchName,
              branchName: employee.branchName,
              branchCode: employee.branchCode,
              grossPay: payrollData.grossPay,
              totalEarnings: payrollData.earnings.reduce(
                (sum, e) => sum + e.amount,
                0
              ),
              totalDeductions: payrollData.deductions.reduce(
                (sum, d) => sum + d.amount,
                0
              ),
              statutory: payrollData.statutory,
              netPay: payrollData.netPaye,
              taxableIncome: payrollData.taxableIncome,
              approvalDate: Date.now(),
              payrollStatus: "pending", // Include individual status
            });
          })
        );
      }

      // 5. Update payroll record (without changing batch status)
      await payroll.update({
        approvedBy: approverId,
        approvalDate: new Date(),
        summaryData: {
          totalGrossPay: totalGross,
          totalNetPay: totalNet,
          totalStatutoryDeductions: totalStatutory,
          totalEmployees: processedEmployees.length,
        },
      });

      // Calculate status summary
      const allItems = await PayrollItem.findAll({
        where: { payrollId },
      });

      const statusSummary = {
        draft: allItems.filter((i) => i.payrollStatus === "draft").length,
        pending: allItems.filter((i) => i.payrollStatus === "pending").length,
        approved: allItems.filter((i) => i.payrollStatus === "approved").length,
        paid: allItems.filter((i) => i.payrollStatus === "paid").length,
        total: allItems.length,
      };

      return res.status(200).json({
        success: true,
        message: `Payroll submitted for ${processedEmployees.length} employees successfully.`,
        payrollId: payroll.id,
        processedCount: processedEmployees.length,
        statusSummary,
        metadata: {
          companyId,
          payPeriodStartDate: payroll.payPeriodStartDate,
          payPeriodEndDate: payroll.payPeriodEndDate,
          paymentDate: payroll.paymentDate,
          approverId,
        },
        summary: payroll.summaryData,
        data: processedEmployees,
      });
    } catch (error) {
      console.error("Error submitting draft payroll:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to submit draft payroll",
        error: error.message,
      });
    }
  }

  async approvePayroll(req, res) {
    const { companyId } = req.params;
    const { payrollId, processedBy, employeeIds } = req.body;

    if (!Array.isArray(employeeIds)) {
      return res.status(400).json({
        success: false,
        message: "Employee IDs must be provided as an array.",
      });
    }

    try {
      const payroll = await Payroll.findOne({
        where: { id: payrollId, companyId },
      });

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll not found.",
        });
      }

      const employees = await Employee.findAll({
        where: { id: employeeIds, companyId },
        attributes: [
          "id",
          "staffNo",
          "firstName",
          "lastName",
          "basicSalary",
          "departmentId",
          "jobTitleId",
          "projectId",
          "employmentType",
          "paymentMethod",
          "mobileNumber",
          "accountName",
          "bankName",
          "branchName",
          "accountNumber",
          "branchCode",
          "bankCode",
        ],
      });

      if (employees.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No matching employees found.",
        });
      }

      // Verify all selected employees have pending payroll items
      const pendingItems = await PayrollItem.findAll({
        where: {
          payrollId,
          employeeId: employeeIds,
          payrollStatus: "pending",
        },
      });

      const uniquePendingItems = [
        ...new Set(pendingItems.map((item) => item.employeeId)),
      ];

      if (uniquePendingItems.length !== employeeIds.length) {
        const missingApproval = employeeIds.filter(
          (id) => !uniquePendingItems.includes(id)
        );
        return res.status(400).json({
          success: false,
          message: "Some employees don't have pending payroll records.",
          missingApproval,
        });
      }
      const processedEmployees = [];
      let totalGross = 0;
      let totalNet = 0;
      let totalStatutory = {};

      const batchSize = 10;
      for (let i = 0; i < employees.length; i += batchSize) {
        const batch = employees.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (employee) => {
            const payrollData =
              await PayrollCalculationService.calculateEmployeePayroll(
                employee,
                {
                  start: payroll.payPeriodStartDate,
                  end: payroll.payPeriodEndDate,
                }
              );

            await PayrollItem.update(
              {
                payrollStatus: "processed", // Update status to processed
                processingDate: new Date(),
                processedBy,
                // expiresAt: null // Clear any expiration
              },
              { where: { payrollId, employeeId: employee.id } }
            );

            // Update totals
            totalGross += payrollData.grossPay;
            totalNet += payrollData.netPaye;
            for (const [key, value] of Object.entries(
              payrollData.statutory || {}
            )) {
              totalStatutory[key] = (totalStatutory[key] || 0) + value;
            }

            processedEmployees.push({
              employeeId: employee.id,
              staffId: employee.staffNo,
              fullName: `${employee.firstName} ${employee.lastName}`,
              basicSalary: employee.basicSalary,
              departmentId: employee.departmentId,
              jobTitleId: employee.jobTitleId,
              projectId: employee.projectId,
              employmentType: employee.employmentType,
              paymentMethod: employee.paymentMethod,
              mobileNumber: employee.mobileNumber,
              accountName: employee.accountName,
              accountNumber: employee.accountNumber,
              bankName: employee.bankName,
              branchName: employee.branchName,
              branchName: employee.branchName,
              branchCode: employee.branchCode,
              grossPay: payrollData.grossPay,
              totalEarnings: payrollData.earnings.reduce(
                (sum, e) => sum + e.amount,
                0
              ),
              totalDeductions: payrollData.deductions.reduce(
                (sum, d) => sum + d.amount,
                0
              ),
              statutory: payrollData.statutory,
              netPay: payrollData.netPaye,
              taxableIncome: payrollData.taxableIncome,
              payrollStatus: "processed",
              processingDate: new Date(),
            });
          })
        );
      }

      await payroll.update({
        processedBy,
        // processingDate: new Date(),
        summaryData: {
          totalGrossPay: totalGross,
          totalNetPay: totalNet,
          totalStatutoryDeductions: totalStatutory,
          totalEmployees: processedEmployees.length,
        },
      });

      // Get updated status summary including any auto-rejected items
      const allItems = await PayrollItem.findAll({ where: { payrollId } });
      const statusSummary = {
        draft: allItems.filter((i) => i.payrollStatus === "draft").length,
        pending: allItems.filter((i) => i.payrollStatus === "pending").length,
        approved: allItems.filter((i) => i.payrollStatus === "approved").length,
        rejected: allItems.filter((i) => i.payrollStatus === "rejected").length,
        paid: allItems.filter((i) => i.payrollStatus === "expired").length,
        total: allItems.length,
      };

      return res.status(200).json({
        success: true,
        message: `Payroll approved for ${processedEmployees.length} employees.`,
        payrollId: payroll.id,
        processedCount: processedEmployees.length,
        statusSummary,
        metadata: {
          companyId,
          payPeriodStartDate: payroll.payPeriodStartDate,
          payPeriodEndDate: payroll.payPeriodEndDate,
          paymentDate: payroll.paymentDate,
          // processingDate: payroll.processingDate,
          processedBy,
        },
        summary: payroll.summaryData,
        data: processedEmployees,
      });
    } catch (error) {
      console.error("Error approving payroll:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to approve payroll",
        error: error.message,
      });
    }
  }

  async rejectPayroll(req, res) {
    const { companyId } = req.params;
    const { payrollId, rejectedBy, rejectionReason, employeeIds } = req.body;

    if (!Array.isArray(employeeIds)) {
      return res.status(400).json({
        success: false,
        message: "Employee IDs must be provided as an array.",
      });
    }

    if (!rejectionReason || rejectionReason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required.",
      });
    }

    try {
      const payroll = await Payroll.findOne({
        where: { id: payrollId, companyId },
      });

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll not found.",
        });
      }

      const employees = await Employee.findAll({
        where: { id: employeeIds, companyId },
        attributes: [
          "id",
          "staffNo",
          "firstName",
          "lastName",
          "basicSalary",
          "departmentId",
          "jobTitleId",
          "projectId",
          "employmentType",
          "paymentMethod",
          "mobileNumber",
          "accountName",
          "bankName",
          "branchName",
          "accountNumber",
          "branchCode",
          "bankCode",
        ],
      });

      if (employees.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No matching employees found.",
        });
      }

      // Verify all selected employees have pending payroll items
      const rejectedItems = await PayrollItem.findAll({
        where: {
          payrollId,
          employeeId: employeeIds,
          payrollStatus: "pending",
        },
      });

      const uniqueRejectedItems = [
        ...new Set(rejectedItems.map((item) => item.employeeId)),
      ];

      if (uniqueRejectedItems.length !== employeeIds.length) {
        const missingRejection = employeeIds.filter(
          (id) => !uniqueRejectedItems.includes(id)
        );
        return res.status(400).json({
          success: false,
          message: "Some employees don't have pending payroll records.",
          missingRejection,
        });
      }
      const processedEmployees = [];
      let totalGross = 0;
      let totalNet = 0;
      let totalStatutory = {};

      const batchSize = 10;
      for (let i = 0; i < employees.length; i += batchSize) {
        const batch = employees.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (employee) => {
            const payrollData =
              await PayrollCalculationService.calculateEmployeePayroll(
                employee,
                {
                  start: payroll.payPeriodStartDate,
                  end: payroll.payPeriodEndDate,
                }
              );

            await PayrollItem.update(
              {
                payrollStatus: "rejected", // Update status to processed
              },
              { where: { payrollId, employeeId: employee.id } }
            );

            // Update totals
            totalGross += payrollData.grossPay;
            totalNet += payrollData.netPaye;
            for (const [key, value] of Object.entries(
              payrollData.statutory || {}
            )) {
              totalStatutory[key] = (totalStatutory[key] || 0) + value;
            }

            processedEmployees.push({
              employeeId: employee.id,
              staffId: employee.staffNo,
              fullName: `${employee.firstName} ${employee.lastName}`,
              basicSalary: employee.basicSalary,
              departmentId: employee.departmentId,
              jobTitleId: employee.jobTitleId,
              projectId: employee.projectId,
              employmentType: employee.employmentType,
              paymentMethod: employee.paymentMethod,
              mobileNumber: employee.mobileNumber,
              accountName: employee.accountName,
              accountNumber: employee.accountNumber,
              bankName: employee.bankName,
              branchName: employee.branchName,
              branchName: employee.branchName,
              branchCode: employee.branchCode,
              grossPay: payrollData.grossPay,
              totalEarnings: payrollData.earnings.reduce(
                (sum, e) => sum + e.amount,
                0
              ),
              totalDeductions: payrollData.deductions.reduce(
                (sum, d) => sum + d.amount,
                0
              ),
              statutory: payrollData.statutory,
              netPay: payrollData.netPaye,
              taxableIncome: payrollData.taxableIncome,
              payrollStatus: "rejected",
            });
          })
        );
      }

      await payroll.update({
        rejectedBy,
        rejectionReason,
        rejectedAt: new Date(),
        summaryData: {
          totalGrossPay: totalGross,
          totalNetPay: totalNet,
          totalStatutoryDeductions: totalStatutory,
          totalEmployees: processedEmployees.length,
        },
      });

      // Get updated status summary including any auto-rejected items
      const allItems = await PayrollItem.findAll({ where: { payrollId } });
      const statusSummary = {
        draft: allItems.filter((i) => i.payrollStatus === "draft").length,
        pending: allItems.filter((i) => i.payrollStatus === "pending").length,
        approved: allItems.filter((i) => i.payrollStatus === "approved").length,
        rejected: allItems.filter((i) => i.payrollStatus === "rejected").length,
        paid: allItems.filter((i) => i.payrollStatus === "expired").length,
        total: allItems.length,
      };

      return res.status(200).json({
        success: true,
        message: `Payroll rejected for ${processedEmployees.length} employees.`,
        payrollId: payroll.id,
        rejectedCount: processedEmployees.length,
        statusSummary,
        metadata: {
          companyId,
          payPeriodStartDate: payroll.payPeriodStartDate,
          payPeriodEndDate: payroll.payPeriodEndDate,
          paymentDate: payroll.paymentDate,
          rejectionReason,
          rejectedBy,
        },
        summary: payroll.summaryData,
        data: processedEmployees,
      });
    } catch (error) {
      console.error("Error rejecting payroll:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to reject payroll",
        error: error.message,
      });
    }
  }

  async refreshPayroll(req, res) {
    const { companyId } = req.params;
    const { payrollId, employeeIds } = req.body;

    // const uniqueEmployeeIds = [...new Set(employeeIds)];

    try {
      // Validate payroll exists and is eligible for refresh
      const payroll = await Payroll.findOne({
        where: {
          id: payrollId,
          companyId,
        },
      });

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll not found or not eligible for refresh.",
        });
      }

      // Get employee details
      const employees = await Employee.findAll({
        where: { id: employeeIds, companyId },
      });

      if (!employees.length) {
        return res.status(404).json({
          success: false,
          message: "No valid employees found for this company.",
        });
      }

      // Ensure these employees are already part of the payroll batch
      const existingItems = await PayrollItem.findAll({
        where: {
          payrollId,
          employeeId: employeeIds,
          [Op.or]: [
            { payrollStatus: "expired" },
            { payrollStatus: "rejected" },
          ],
        },
        attributes: ["employeeId"],
        group: ["employeeId"],
      });

      const existingEmployeeIds = new Set(
        existingItems.map((i) => i.employeeId)
      );
      const missingEmployees = employeeIds.filter(
        (id) => !existingEmployeeIds.has(id)
      );

      if (missingEmployees.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Some employees do not have payroll records in this batch.",
          missingEmployeeIds: missingEmployees,
        });
      }

      // Recalculate payroll data
      const refreshedEmployees = [];
      let totalGross = 0;
      let totalNet = 0;
      let totalStatutory = {};

      for (const employee of employees) {
        const payrollData =
          await PayrollCalculationService.calculateEmployeePayroll(employee, {
            start: payroll.payPeriodStartDate,
            end: payroll.payPeriodEndDate,
          });

        // Delete existing PayrollItems for this employee
        await PayrollItem.destroy({
          where: { payrollId, employeeId: employee.id },
        });

        // Rebuild PayrollItems
        const allItems = [
          ...payrollData.earnings.map((e) => ({
            itemType: "earning",
            itemName: e.name,
            amount: e.amount,
            isTaxable: e.isTaxable || false,
          })),
          ...payrollData.deductions.map((d) => ({
            itemType: "deduction",
            itemName: d.name,
            amount: d.amount,
            isTaxable: d.isTaxable || false,
          })),
          ...Object.entries(payrollData.statutory || {}).map(
            ([key, value]) => ({
              itemType: "statutory",
              itemName: key,
              amount: value,
            })
          ),
          {
            itemType: "basic_salary",
            itemName: "Basic Salary",
            amount: employee.basicSalary,
            isTaxable: true,
          },
        ];

        for (const item of allItems) {
          await PayrollItem.create({
            payrollId,
            employeeId: employee.id,
            ...item,
          });
        }

        totalGross += payrollData.grossPay;
        totalNet += payrollData.netPaye;

        for (const [key, value] of Object.entries(
          payrollData.statutory || {}
        )) {
          if (!totalStatutory[key]) totalStatutory[key] = 0;
          totalStatutory[key] += value;
        }

        refreshedEmployees.push({
          payrollId: payroll.id,
          employeeId: employee.id,
          staffId: employee.staffNo,
          fullName: `${employee.firstName} ${employee.lastName}`,
          department: employee.departmentId,
          jobTitle: employee.jobTitleId,
          basicSalary: employee.basicSalary,
          paymentMethod: employee.paymentMethod,
          mobileNumber: employee.mobileNumber,
          accountName: employee.accountName,
          accountNumber: employee.accountNumber,
          bankName: employee.bankName,
          branchName: employee.branchName,
          branchName: employee.branchName,
          branchCode: employee.branchCode,
          grossPay: payrollData.grossPay,
          earnings: payrollData.earnings,
          totalEarnings: payrollData.earnings.reduce(
            (sum, e) => sum + e.amount,
            0
          ),
          deductions: payrollData.deductions,
          totalDeductions: payrollData.deductions.reduce(
            (sum, d) => sum + d.amount,
            0
          ),
          statutory: payrollData.statutory,
          netPay: payrollData.netPaye,
          taxableIncome: payrollData.taxableIncome,
          payPeriodStartDate: payroll.payPeriodStartDate,
          payPeriodEndDate: payroll.payPeriodEndDate,
          paymentDate: payroll.paymentDate,
          submittedAt: new Date(),
        });
      }

      // Update payroll record
      await payroll.update({
        payrollStatus: "draft",
        summaryData: {
          totalGrossPay: totalGross,
          totalNetPay: totalNet,
          totalStatutoryDeductions: totalStatutory,
          totalEmployees: refreshedEmployees.length,
        },
        submittedAt: new Date(),
        notes: null,
      });

      return res.status(200).json({
        success: true,
        message: "Payroll refreshed successfully.",
        payrollId: payroll.id,
        metadata: {
          companyId,
          payPeriodStartDate: payroll.payPeriodStartDate,
          payPeriodEndDate: payroll.payPeriodEndDate,
          paymentDate: payroll.paymentDate,
          submittedAt: payroll.submittedAt,
        },
        summary: payroll.summaryData,
        data: refreshedEmployees,
      });
    } catch (error) {
      console.error("Error refreshing payroll:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to refresh payroll",
        error: error.message,
      });
    }
  }

  async getAllPayrolls(req, res) {
    const { companyId } = req.params;

    try {
      const payrolls = await Payroll.findAll({
        where: { companyId },
        attributes: [
          "id",
          "payPeriodStartDate",
          "payPeriodEndDate",
          "paymentDate",
          "submittedAt",
          "summaryData",
          "notes",
          "updatedAt",
        ],
        order: [["updatedAt", "DESC"]],
      });

      if (!payrolls.length) {
        return res.status(404).json({
          success: false,
          message: "No payroll batches found for this company.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "All payroll batches retrieved successfully.",
        data: payrolls.map((p) => ({
          payrollId: p.id,
          payPeriodStartDate: p.payPeriodStartDate,
          payPeriodEndDate: p.payPeriodEndDate,
          paymentDate: p.paymentDate,
          submittedAt: p.submittedAt,
          summary: p.summaryData,
          notes: p.notes || "No notes",
          updatedAt: p.updatedAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching all payroll records:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve payroll records",
        error: error.message,
      });
    }
  }

  async getPayrollsByStatus(req, res) {
    const { companyId, status, payrollId } = req.params;

    try {
      const payroll = await Payroll.findOne({
        where: {
          companyId,
          id: payrollId,
        },
      });

      if (!payroll) {
        return res.status(200).json({
          // Changed to 200 OK
          success: false,
          message: `No payroll found ID ${payrollId}.`,
          payrollId: payrollId, // Still send payrollId for context
          data: [], // Indicate no data
        });
      }

      const payrollItems = await PayrollItem.findAll({
        where: { payrollId, payrollStatus: status },
        include: [
          {
            model: Employee,
            as: "employee",
            attributes: [
              "id",
              "firstName",
              "lastName",
              "staffNo",
              "basicSalary",
              "paymentMethod",
              "departmentId",
              "jobTitleId",
              "projectId",
              "employmentType",
              "mobileNumber",
              "accountName",
              "bankName",
              "branchName",
              "accountNumber",
              "branchCode",
              "bankCode",
            ],
          },
        ],
        order: [["employeeId", "ASC"]],
      });

      if (!payrollItems.length) {
        return res.status(200).json({
          // Changed to 200 OK
          success: false,
          message: `No payroll items found for this payroll ID ${payrollId} with status as ${status}.`,
          payrollId: payrollId, // Still send payrollId for context
          metadata: {
            companyId: payroll.companyId,
            payPeriodStartDate: payroll.payPeriodStartDate,
            payPeriodEndDate: payroll.payPeriodEndDate,
            paymentDate: payroll.paymentDate,
            submittedAt: payroll.submittedAt,
            approvalDate: payroll.approvalDate,
            processingDate: payroll.processingDate,
            rejectedAt: payroll.rejectedAt,
            rejectionReason: payroll.rejectionReason,
            notes: payroll.notes || "No additional details",
          },
          summary: payroll.summaryData || {},
          data: [], // Indicate no data
        });
      }

      // Group payroll data by employee
      const employeeMap = {};

      // Create payroll period object for the calculation service
      const payrollPeriod = {
        start: payroll.payPeriodStartDate,
        end: payroll.payPeriodEndDate,
      };

      // First, group the payroll items by employee
      for (const item of payrollItems) {
        const empId = item.employeeId;

        if (!employeeMap[empId]) {
          const emp = item.employee;
          employeeMap[empId] = {
            employeeId: emp.id,
            staffId: emp.staffNo,
            fullName: `${emp.firstName} ${emp.lastName}`,
            basicSalary: emp.basicSalary,
            departmentId: emp.departmentId,
            jobTitleId: emp.jobTitleId,
            projectId: emp.projectId,
            employmentType: emp.employmentType,
            paymentMethod: emp.paymentMethod,
            mobileNumber: emp.mobileNumber,
            accountName: emp.accountName,
            accountNumber: emp.accountNumber,
            bankName: emp.bankName,
            branchName: emp.branchName,
            bankCode: emp.bankCode,
            branchCode: emp.branchCode,
            grossPay: 0,
            totalEarnings: 0,
            totalDeductions: 0,
            statutory: {},
            earnings: [],
            deductions: [],
            netPay: 0,
            taxableIncome: 0,
          };
        }

        const empRecord = employeeMap[empId];

        switch (item.itemType) {
          case "earning":
            empRecord.earnings.push({
              name: item.itemName,
              amount: item.amount,
            });
            empRecord.totalEarnings += Number(item.amount);
            break;
          case "deduction":
            empRecord.deductions.push({
              name: item.itemName,
              amount: item.amount,
            });
            empRecord.totalDeductions += Number(item.amount);
            break;
          case "statutory":
            empRecord.statutory[item.itemName] = Number(item.amount);
            break;
          case "basic_salary":
            empRecord.grossPay += Number(item.amount);
            break;
        }
      }

      // Use PayrollCalculationService to calculate netPay and taxableIncome for each employee
      const formattedEmployees = await Promise.all(
        Object.values(employeeMap).map(async (emp) => {
          // Create employee object in format expected by calculation service
          const employeeForCalculation = {
            id: emp.employeeId,
            firstName: emp.fullName.split(" ")[0],
            lastName: emp.fullName.split(" ").slice(1).join(" "),
            basicSalary: emp.basicSalary,
          };

          try {
            // Get calculated payroll data for this employee
            const calculatedData =
              await PayrollCalculationService.calculateEmployeePayroll(
                employeeForCalculation,
                payrollPeriod
              );

            // Update the employee record with calculated values
            emp.taxableIncome = calculatedData.taxableIncome;
            emp.netPay = calculatedData.netPaye;

            return emp;
          } catch (error) {
            console.error(
              `Error calculating payroll for employee ${emp.fullName}:`,
              error
            );
            return emp; // Return original employee data if calculation fails
          }
        })
      );

      return res.status(200).json({
        success: true,
        message: `Payroll '${payrollId}' with status '${status}' retrieved successfully.`,
        payrollId: payroll.id,
        payrollStatus: payroll.payrollStatus,
        metadata: {
          companyId: payroll.companyId,
          payPeriodStartDate: payroll.payPeriodStartDate,
          payPeriodEndDate: payroll.payPeriodEndDate,
          paymentDate: payroll.paymentDate,
          submittedAt: payroll.submittedAt,
          approvalDate: payroll.approvalDate,
          processingDate: payroll.processingDate,
          expiresAt: payroll.expiresAt,
          rejectedAt: payroll.rejectedAt,
          rejectionReason: payroll.rejectionReason,
          notes: payroll.notes || "No additional details",
        },
        summary: payroll.summaryData || {},
        data: formattedEmployees,
      });
    } catch (error) {
      console.error(`Error fetching payroll by status '${status}':`, error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve payroll by status",
        error: error.message,
      });
    }
  }

  async deletePayrollsByCompany(req, res) {
    const { companyId } = req.params;

    try {
      // Step 1: Get all payroll IDs for the company
      const payrolls = await Payroll.findAll({
        where: { companyId },
        attributes: ["id"],
      });

      if (!payrolls.length) {
        return res.status(404).json({
          success: false,
          message: `No payroll records found for company '${companyId}'.`,
        });
      }

      const payrollIds = payrolls.map((p) => p.id);

      // Step 2: Delete all related PayrollItems
      const deletedItems = await PayrollItem.destroy({
        where: { payrollId: payrollIds },
      });

      // Step 3: Delete Payrolls
      const deletedPayrolls = await Payroll.destroy({
        where: { id: payrollIds },
      });

      return res.status(200).json({
        success: true,
        message: `Deleted ${deletedPayrolls} payroll batch(es) and ${deletedItems} payroll item(s) for company '${companyId}'.`,
      });
    } catch (error) {
      console.error(
        `Error deleting payrolls for company '${companyId}':`,
        error
      );
      return res.status(500).json({
        success: false,
        message: "Failed to delete payroll records",
        error: error.message,
      });
    }
  }

  async getPayrollById(req, res) {
    const { payrollId } = req.params;

    try {
      // Fetch payroll details
      const payroll = await Payroll.findOne({
        where: { id: payrollId },
      });

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll batch not found.",
        });
      }

      // Ensure the correct association is used
      const employees = await Employee.findAll({
        include: [
          {
            model: PayrollItem,
            required: true, // Ensures only employees with payroll items are fetched
            where: { payrollId },
            attributes: ["employeeId", "payrollStatus"],
            as: "PayrollItems", // Must match the association alias
          },
        ],
        attributes: [
          "id",
          "firstName",
          "lastName",
          "staffNo",
          "basicSalary",
          "paymentMethod",
          "departmentId",
          "jobTitleId",
        ],
        order: [["id", "ASC"]],
      });

      if (!employees.length) {
        return res.status(404).json({
          success: false,
          message: "No employees found in this payroll batch.",
        });
      }

      // Process employees and calculate payroll dynamically
      const formattedEmployees = await Promise.all(
        employees.map(async (employee) => {
          const payrollData =
            await PayrollCalculationService.calculateEmployeePayroll(employee, {
              start: payroll.payPeriodStartDate,
              end: payroll.payPeriodEndDate,
            });

          return {
            employeeId: employee.id,
            staffId: employee.staffNo,
            fullName: `${employee.firstName} ${employee.lastName}`,
            departmentId: employee.departmentId,
            jobTitleId: employee.jobTitleId,
            basicSalary: employee.basicSalary,
            paymentMethod: employee.paymentMethod,
            payrollStatus: employee.PayrollItems[0]?.payrollStatus || "Unknown",
            grossPay: payrollData?.grossPay || 0,
            earnings: payrollData?.earnings || [],
            totalEarnings: payrollData?.earnings
              ? payrollData.earnings.reduce((sum, e) => sum + e.amount, 0)
              : 0,
            deductions: payrollData?.deductions || [],
            totalDeductions: payrollData?.deductions
              ? payrollData.deductions.reduce((sum, d) => sum + d.amount, 0)
              : 0,
            statutory: payrollData?.statutory || {},
            netPay: payrollData?.netPaye || 0,
            taxableIncome: payrollData?.taxableIncome || 0,
          };
        })
      );

      return res.status(200).json({
        success: true,
        message: "Payroll batch retrieved successfully.",
        payrollId: payroll.id,
        metadata: {
          companyId: payroll.companyId,
          payPeriodStartDate: payroll.payPeriodStartDate,
          payPeriodEndDate: payroll.payPeriodEndDate,
          paymentDate: payroll.paymentDate,
          submittedAt: payroll.submittedAt,
          notes: payroll.notes || "No additional details",
        },
        summary: payroll.summaryData,
        data: formattedEmployees,
      });
    } catch (error) {
      console.error("Error fetching payroll by ID:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve payroll batch",
        error: error.message,
      });
    }
  }

  async getPayrollSummary(req, res) {
    const { companyId } = req.params;
    const { year } = req.query; // Optional year filter

    try {
      const whereClause = { companyId };
      if (year) {
        whereClause.payPeriodStartDate = {
          [Op.between]: [new Date(`${year}-01-01`), new Date(`${year}-12-31`)],
        };
      }

      const payrolls = await Payroll.findAll({
        where: whereClause,
        order: [["payPeriodStartDate", "DESC"]],
      });

      // console.log("Payroll data:", payrolls);

      if (!payrolls.length) {
        return res.status(404).json({
          success: false,
          message: "No payroll records found for this company.",
        });
      }

      const payrollSummaries = await Promise.all(
        payrolls.map(async (payroll) => {
          const items = await PayrollItem.findAll({
            where: { payrollId: payroll.id, payrollStatus: "processed" },
          });
          const employeeIds = [...new Set(items.map((item) => item.employeeId))]
            .length;

          // Ensure payPeriodStartDate is a valid Date object
          let startDate = payroll.payPeriodStartDate;
          if (!(startDate instanceof Date) || isNaN(startDate)) {
            startDate = new Date(payroll.payPeriodStartDate); // Try parsing as string
          }
          if (isNaN(startDate)) {
            console.warn(
              `Invalid date for payrollId ${payroll.id}: ${payroll.payPeriodStartDate}`
            );
            startDate = new Date(); // Fallback to current date for safety
          }

          const startMonth = startDate.toLocaleString("default", {
            month: "long",
          });
          const year = startDate.getFullYear();

          return {
            id: payroll.id,
            month: startMonth,
            year,
            noOfEmployees: employeeIds,
          };
        })
      );

      const totalMonths = payrollSummaries.length;
      const totalEmployees = payrollSummaries.reduce(
        (sum, p) => sum + p.noOfEmployees,
        0
      );

      return res.status(200).json({
        success: true,
        data: payrollSummaries,
        summary: { totalMonths, totalEmployees },
      });
    } catch (error) {
      console.error("Error generating payroll summary:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to generate payroll summary",
        error: error.message,
      });
    }
  }

  async getPayrollBatchDetails(req, res) {
    const { companyId, payrollId } = req.params;

    try {
      const payroll = await Payroll.findByPk(payrollId, {
        where: { companyId },
      });
      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll batch not found.",
        });
      }

      const items = await PayrollItem.findAll({
        where: { payrollId, payrollStatus: "processed" },
        include: [
          {
            model: Employee,
            as: "employee",
            attributes: [
              "id",
              "firstName",
              "lastName",
              "staffNo",
              "basicSalary",
            ],
          },
        ],
      });

      if (!items.length) {
        return res.status(404).json({
          success: false,
          message: "No processed payroll items found in this batch.",
        });
      }

      const employeeDetails = items.reduce((acc, item) => {
        const emp = item.employee;
        if (!acc[emp.id]) {
          acc[emp.id] = {
            employeeId: emp.id,
            fullName: `${emp.firstName} ${emp.lastName}`,
            basicSalary: Number(emp.basicSalary) || 0,
            netPay: 0,
            staffNo: emp.staffNo,
          };
        }
        acc[emp.id].netPay += Number(item.amount) || 0; // Aggregate net pay if needed
        return acc;
      }, {});

      return res.status(200).json({
        success: true,
        payrollId,
        employees: Object.values(employeeDetails),
      });
    } catch (error) {
      console.error("Error fetching payroll batch details:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve payroll batch details",
        error: error.message,
      });
    }
  }

  async getCompanyPayrolls(req, res) {
    const { companyId } = req.params;

    try {
      const payrolls = await Payroll.findAll({
        where: { companyId },
        attributes: [
          "id",
          "payPeriodStartDate",
          "payPeriodEndDate",
          "paymentDate",
          // "payrollStatus",
          "createdAt",
          "updatedAt",
        ],
        order: [["payPeriodEndDate", "DESC"]],
      });

      // if (!payrolls.length) {
      //   return res.status(404).json({
      //     success: false,
      //     message: "No payroll records found for this company.",
      //   });
      // }

      return res.status(200).json({
        success: true,
        message: "Payroll records retrieved successfully.",
        data: payrolls.map((payroll) => ({
          payrollId: payroll.id,
          payPeriodStartDate: payroll.payPeriodStartDate,
          payPeriodEndDate: payroll.payPeriodEndDate,
          paymentDate: payroll.paymentDate,
          // payrollStatus: payroll.payrollStatus,
          createdAt: payroll.createdAt,
          updatedAt: payroll.updatedAt,
        })),
        count: payrolls.length,
      });
    } catch (error) {
      console.error("Error fetching company payrolls:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve company payroll records",
        error: error.message,
      });
    }
  }

  async getEmployeePayslipData({ companyId, employeeId, payrollId }) {
    // const { companyId, employeeId, payrollId } = req.params;

    try {
      console.log(
        `Fetching payslip data for companyId: ${companyId}, employeeId: ${employeeId}, payrollId: ${payrollId}`
      );
      const payroll = await Payroll.findOne({
        where: { companyId, id: payrollId },
        include: [
          {
            model: PayrollItem,
            as: "items",
            where: { employeeId, payrollStatus: "processed" },
            required: true,
          },
        ],
      });

      if (!payroll) {
        throw new Error("Payroll data not found or not processed");
      }

      const employee = await Employee.findByPk(employeeId);
      const company = await Company.findByPk(companyId);
      const department = await Department.findByPk(employee.departmentId, {
        attributes: ["title"],
      });
      const jobTitle = await JobTitle.findByPk(employee.jobTitleId, {
        attributes: ["name"],
      });
      const processor = await User.findByPk(payroll.processedBy, {
        attributes: ["firstName", "lastName"],
      });

      if (!employee || !company) {
        throw new Error("Employee or Company not found");
      }

      if (!department) {
        throw new Error("Department not found");
      }

      if (!jobTitle) {
        throw new Error("Job title not found");
      }

      if (!processor) {
        throw new Error("Payroll processor not found");
      }

      //payPeriodStartDate is a valid Date object
      let startDate = payroll.payPeriodStartDate;
      if (!(startDate instanceof Date) || isNaN(startDate)) {
        startDate = new Date(payroll.payPeriodStartDate);
      }
      if (isNaN(startDate)) {
        console.warn(
          `Invalid date for payrollId ${payroll.id}: ${payroll.payPeriodStartDate}`
        );
        startDate = new Date();
      }

      const month = startDate.toLocaleString("default", { month: "long" });
      const year = startDate.getFullYear();

      let payrollData =
        await PayrollCalculationService.calculateEmployeePayroll(employee, {
          start: payroll.payPeriodStartDate,
          end: payroll.payPeriodEndDate,
        });

      const payrollItems = payroll.PayrollItems || [];
      const earnings = { "Basic Salary": payrollData.basicSalary };
      const specificEarnings = {} || 0;
      const statutoryDeductions = {
        NSSF: payrollData.statutory.nssf,
        SHIF: payrollData.statutory.shif,
        "Housing Levy": payrollData.statutory.housingLevy,
        PAYE: payrollData.statutory.paye,
      };
      const specificDeductions = {} || 0;

      payrollItems.forEach((item) => {
        if (item.itemType === "earning" && item.itemName !== "basic_salary") {
          specificEarnings[item.itemName] = Number(item.amount) || 0;
        } else if (
          item.itemType === "deduction" &&
          !["NSSF", "SHIF", "Housing Levy", "PAYE"].includes(item.itemName)
        ) {
          specificDeductions[item.itemName] = Number(item.amount) || 0;
        }
      });

      Object.assign(earnings, specificEarnings);

      const grossPay = payrollData.grossPay;
      // const totalDeductions = payrollData.totalDeductions;
      const allDeductions = payrollData.allDeductions;
      const netPay = payrollData.netPaye;

      const payeInfo = {
        totalEarnings: grossPay,
        lessPreTaxDeductions: [
          { label: "NSSF", amount: payrollData.statutory.nssf },
          { label: "SHIF", amount: payrollData.statutory.shif },
          { label: "Housing Levy", amount: payrollData.statutory.housingLevy },
        ],
        taxablePay: payrollData.taxableIncome,
        grossTax: payrollData.grossTax,
        personalRelief: payrollData.personalRelief,
        insuranceRelief: payrollData.insuranceRelief || 0,
        housingLevyRelief: payrollData.housingLevyRelief || 0,
        paye: payrollData.statutory.paye,
      };

      const payslip = {
        month: month,
        year: year,
        company: company.name,
        companyLogo: company.companyLogo,
        payDate: payroll.paymentDate,
        createdOn:
          payroll.processingDate || new Date().toISOString().split("T")[0],
        createdBy: `${processor.firstName} ${processor.lastName}`,
        staffNo: employee.staffNo,
        fullName: `${employee.firstName} ${employee.lastName}`,
        department: department.title,
        jobTitle: jobTitle.name,
        currency: employee.currency,
        kraPin: employee.kraPin,
        earnings: Object.fromEntries(
          Object.entries(earnings).map(([key, value]) => [
            key,
            formatCurrency(value),
          ])
        ),
        otherEarnings: Object.fromEntries(
          Object.entries(specificEarnings).map(([key, value]) => [
            key,
            formatCurrency(value),
          ])
        ),
        grossPay: formatCurrency(grossPay, employee.currency),
        statutoryDeductions: Object.fromEntries(
          Object.entries(statutoryDeductions).map(([key, value]) => [
            key,
            formatCurrency(value),
          ])
        ),
        otherDeductions: Object.fromEntries(
          Object.entries(specificDeductions).map(([key, value]) => [
            key,
            formatCurrency(value),
          ])
        ),
        allDeductions: formatCurrency(allDeductions),
        netPay: formatCurrency(netPay),
        payeInfo: {
          ...payeInfo,
          totalEarnings: formatCurrency(payeInfo.totalEarnings),
          lessPreTaxDeductions: payeInfo.lessPreTaxDeductions.map((item) => ({
            ...item,
            amount: formatCurrency(item.amount),
          })),
          taxablePay: formatCurrency(payeInfo.taxablePay),
          grossTax: formatCurrency(payeInfo.grossTax),
          personalRelief: formatCurrency(payeInfo.personalRelief),
          insuranceRelief: formatCurrency(payeInfo.insuranceRelief),
          housingLevyRelief: formatCurrency(payeInfo.housingLevyRelief),
          paye: formatCurrency(payeInfo.paye),
        },
      };

      return { data: payslip };
    } catch (error) {
      throw error;
    }
  }

  async getEmployeePayslip(req, res) {
    try {
      console.log(`Request params: ${JSON.stringify(req.params)}`); // Debug params
      const { companyId, employeeId, payrollId } = req.params || {}; // Default to empty object if undefined
      if (!companyId || !employeeId || !payrollId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const result = await this.getEmployeePayslipData({
        companyId,
        employeeId,
        payrollId,
      });
      return res.status(200).json(result);
    } catch (error) {
      console.error(`Error in getEmployeePayslip: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
  }

  async sendPayslipsEmail(req, res) {
    const { companyId } = req.params;
    const { employeeIds, payrollId } = req.body;

    try {
      const payroll = await Payroll.findByPk(payrollId, {
        where: { companyId },
      });
      if (!payroll) {
        return res.status(404).json({ error: "Payroll batch not found" });
      }

      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },

        connectionTimeout: 20000,
        socketTimeout: 30000,
        // debug: true,
      });

      transporter.verify((error, success) => {
        if (error) {
          console.log("SMTP connection error:", error);
        } else {
          console.log("SMTP server is ready to take messages");
        }
      });

      const emailPromises = employeeIds.map(async (employeeId) => {
        const payslipResponse = await this.getEmployeePayslipData({
          companyId,
          employeeId,
          payrollId,
        });
        const payslip = payslipResponse.data;
        const employee = await Employee.findByPk(employeeId);
        const company = await Company.findByPk(companyId);
        if (!employee || !company) {
          throw new Error(
            `Employee or Company not found for employeeId ${employeeId}`
          );
        }

        //payPeriodStartDate is a valid Date object
        let startDate = payroll.payPeriodStartDate;
        if (!(startDate instanceof Date) || isNaN(startDate)) {
          startDate = new Date(payroll.payPeriodStartDate);
        }
        if (isNaN(startDate)) {
          console.warn(
            `Invalid date for payrollId ${payroll.id}: ${payroll.payPeriodStartDate}`
          );
          startDate = new Date();
        }

        const month = startDate.toLocaleString("default", { month: "long" });
        const year = startDate.getFullYear();

            const latexContent = `
\\documentclass[a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=0.5in}
\\usepackage{booktabs}
\\usepackage{array}

\\begin{document}

\\centering
\\textbf ${payslip.company} \\\\
\\textbf{Payslip for the month of ${month} ${year}}

\\vspace{0.5cm}

\\begin{tabular}{p{2.5in} p{2in}}
\\toprule
\\textbf{Employee No.:} & ${payslip.staffNo} \\\\
\\textbf{Name:} & ${payslip.fullName} \\\\
\\textbf{Pay Date:} & ${payslip.payDate} \\\\
\\textbf{Department:} & ${payslip.department} \\\\
\\textbf{Job Title:} & ${payslip.jobTitle} \\\\
\\textbf{Currency:} & ${payslip.currency} \\\\
\\textbf{Kra Pin:} & ${payslip.kraPin} \\\\
\\bottomrule
\\end{tabular}

\\vspace{0.5cm}

\\textbf{Earnings:} \\\\
\\begin{tabular}{lr}
\\toprule

Basic Salary & ${payslip.earnings["Basic Salary"]} \\\\
${
  Object.entries(payslip.otherEarnings)
    .map(([name, amount]) => `${name} & ${amount || 0}`)
    .join("\\\\\n") || ""
} \\\\
\\midrule
\\textbf{Gross Pay} & ${payslip.grossPay} \\\\
\\bottomrule
\\end{tabular}

\\vspace{0.5cm}

\\textbf{Deductions:} \\\\
\\begin{tabular}{lr}
\\toprule

${Object.entries(payslip.statutoryDeductions)
  .map(([name, amount]) => `${name} & ${amount || 0}`)
  .join("\\\\\n")} \\\\
${
  Object.entries(payslip.otherDeductions)
    .map(([name, amount]) => `${name} & ${amount || 0}`)
    .join("\\\\\n") || ""
} \\\\
\\midrule
\\textbf{Total Deductions} & ${payslip.allDeductions} \\\\
\\bottomrule
\\end{tabular}

\\vspace{0.5cm}

\\textbf{Net Pay:} \\textbf{${payslip.netPay} ${payslip.currency}}

\\vspace{0.5cm}

\\textbf{PAYE Information:} \\\\
\\begin{tabular}{lr}
\\toprule
\\textbf{Description} & \\textbf{Amount (${payslip.currency})} \\\\
\\midrule
\\textbf{Total Earnings} & ${payslip.payeInfo.totalEarnings} \\\\
\\textbf{Less Pre-Tax Deductions:} & \\\\
${
  (payslip.payeInfo.lessPreTaxDeductions || [])
    .map(({ label, amount }) => `${label} & ${amount || 0}`)
    .join("\\\\\n") || "No pre-tax deductions"
} \\\\
\\midrule
\\textbf{Taxable Pay} & ${payslip.payeInfo.taxablePay} \\\\
\\midrule
\\textbf{Gross Tax} & ${payslip.payeInfo.grossTax} \\\\
\\textbf{Personal Relief} & ${payslip.payeInfo.personalRelief} \\\\
\\textbf{Insurance Relief} & ${payslip.payeInfo.insuranceRelief} \\\\
\\textbf{Housing Levy Relief} & ${payslip.payeInfo.housingLevyRelief} \\\\
\\textbf{PAYE} & ${payslip.payeInfo.paye} \\\\
\\bottomrule
\\end{tabular}

\\vspace{0.5cm}

\\begin{tabular}{p{2.5in} p{2in}}
\\toprule
\\textbf{Created On:} & ${payslip.createdOn} \\\\
\\textbf{CreatedBy:} & ${payslip.createdBy} \\\\
\\bottomrule
\\end{tabular}

\\end{document}
      `;

        const latexFile = `payslip_${payslip.fullName}.tex`;
        fs.writeFileSync(latexFile, latexContent);

        // Generate PDF using latexmk
        const pdfProcess = spawn("latexmk", ["-pdf", "-g", latexFile]);
        let pdfOutput = "";
        let pdfError = "";

        pdfProcess.stdout.on("data", (data) => {
          pdfOutput += data.toString();
          console.log(`latexmk output: ${data}`);
        });
        pdfProcess.stderr.on("data", (data) => {
          pdfError += data.toString();
          console.log(`latexmk error: ${data}`);
        });

        const exitCode = await new Promise((resolve, reject) => {
          pdfProcess.on("close", (code) => resolve(code));
          pdfProcess.on("error", (err) => reject(err));
        });

        if (exitCode !== 0 || pdfError) {
          throw new Error(
            `LaTeX compilation failed for ${latexFile}: Exit code ${exitCode}, Error: ${pdfError}`
          );
        }

        const pdfFile = `payslip_${payslip.fullName}.pdf`;
        if (!fs.existsSync(pdfFile)) {
          throw new Error(
            `PDF file not generated: ${pdfFile}. Output: ${pdfOutput}, Error: ${pdfError}`
          );
        }

        const stats = fs.statSync(pdfFile);
        if (stats.size === 0) {
          throw new Error(`PDF file is empty: ${pdfFile}`);
        }

        const mailOptions = {
          from: `"Payroll System" <${process.env.EMAIL_USER}>`,
          to: employee.workEmail || employee.personalEmail,
          subject: `Payslip for ${month} ${year}`,
          text: `Dear ${employee.firstName},\n\nPlease find your payslip attached.\n\nBest regards,\n${company.name}`,
          attachments: [
            {
              filename: `payslip_${payslip.fullName}.pdf`,
              path: pdfFile,
            },
          ],
        };
        console.log(`Sending payslip to ${mailOptions.to}`);
        await transporter.sendMail(mailOptions);

        // Clean up temporary files
        fs.unlinkSync(latexFile);
        fs.unlinkSync(pdfFile);
      });

      await Promise.all(emailPromises);

      return res.status(200).json({
        success: true,
        message: "Payslips sent successfully",
      });
    } catch (error) {
      console.error("Error sending payslips:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to send payslips",
        error: error.message,
      });
    }
  }

  async downloadPayslipsPDF(req, res) {
    const { companyId } = req.params;
    const { employeeIds, payrollId } = req.body;

    let pdfFiles = []; // Declare outside try block for cleanup

    try {
      const payroll = await Payroll.findByPk(payrollId, {
        where: { companyId },
      });
      if (!payroll) {
        return res.status(404).json({ error: "Payroll batch not found" });
      }

      const pdfPromises = employeeIds.map(async (employeeId) => {
        try {
          const payslipResponse = await this.getEmployeePayslipData({
            companyId,
            employeeId,
            payrollId,
          });
          const payslip = payslipResponse.data;
          const employee = await Employee.findByPk(employeeId);

          let startDate = payroll.payPeriodStartDate;
          if (!(startDate instanceof Date) || isNaN(startDate)) {
            startDate = new Date(payroll.payPeriodStartDate);
          }
          if (isNaN(startDate)) {
            console.warn(
              `Invalid date for payrollId ${payroll.id}: ${payroll.payPeriodStartDate}`
            );
            startDate = new Date();
          }

          const month = startDate.toLocaleString("default", { month: "long" });
          const year = startDate.getFullYear();

          // Validate and sanitize payslip data
          const safePayslip = {
            companyLogo: payslip.companyLogo,
            company: payslip.company,
            staffNo: payslip.staffNo,
            fullName: payslip.fullName,
            payDate: payslip.payDate,
            department: payslip.department,
            jobTitle: payslip.jobTitle,
            currency: payslip.currency,
            kraPin: payslip.kraPin,
            earnings: payslip.earnings,
            otherEarnings: payslip.otherEarnings || 0,
            grossPay: payslip.grossPay,
            statutoryDeductions: payslip.statutoryDeductions,
            otherDeductions: payslip.otherDeductions || 0,
            allDeductions: payslip.allDeductions,
            netPay: payslip.netPay,
            payeInfo: payslip.payeInfo,
            createdOn: payslip.createdOn,
            createdBy: payslip.createdBy,
          };
          console.log(
            `Generating payslip for ${safePayslip.fullName} (${employeeId})...`
          );

             const latexContent = `
\\documentclass[a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=0.5in}
\\usepackage{booktabs}
\\usepackage{array}

\\begin{document}

\\centering
\\textbf ${payslip.company} \\\\
\\textbf{Payslip for the month of ${month} ${year}}

\\vspace{0.5cm}

\\begin{tabular}{p{2.5in} p{2in}}
\\toprule
\\textbf{Employee No.:} & ${payslip.staffNo} \\\\
\\textbf{Name:} & ${payslip.fullName} \\\\
\\textbf{Pay Date:} & ${payslip.payDate} \\\\
\\textbf{Department:} & ${payslip.department} \\\\
\\textbf{Job Title:} & ${payslip.jobTitle} \\\\
\\textbf{Currency:} & ${payslip.currency} \\\\
\\textbf{Kra Pin:} & ${payslip.kraPin} \\\\
\\bottomrule
\\end{tabular}

\\vspace{0.5cm}

\\textbf{Earnings:} \\\\
\\begin{tabular}{lr}
\\toprule

Basic Salary & ${payslip.earnings["Basic Salary"]} \\\\
${
  Object.entries(payslip.otherEarnings)
    .map(([name, amount]) => `${name} & ${amount || 0}`)
    .join("\\\\\n") || ""
} \\\\
\\midrule
\\textbf{Gross Pay} & ${payslip.grossPay} \\\\
\\bottomrule
\\end{tabular}

\\vspace{0.5cm}

\\textbf{Deductions:} \\\\
\\begin{tabular}{lr}
\\toprule

${Object.entries(payslip.statutoryDeductions)
  .map(([name, amount]) => `${name} & ${amount || 0}`)
  .join("\\\\\n")} \\\\
${
  Object.entries(payslip.otherDeductions)
    .map(([name, amount]) => `${name} & ${amount || 0}`)
    .join("\\\\\n") || ""
} \\\\
\\midrule
\\textbf{Total Deductions} & ${payslip.allDeductions} \\\\
\\bottomrule
\\end{tabular}

\\vspace{0.5cm}

\\textbf{Net Pay:} \\textbf{${payslip.netPay} ${payslip.currency}}

\\vspace{0.5cm}

\\textbf{PAYE Information:} \\\\
\\begin{tabular}{lr}
\\toprule
\\textbf{Description} & \\textbf{Amount (${payslip.currency})} \\\\
\\midrule
\\textbf{Total Earnings} & ${payslip.payeInfo.totalEarnings} \\\\
\\textbf{Less Pre-Tax Deductions:} & \\\\
${
  (payslip.payeInfo.lessPreTaxDeductions || [])
    .map(({ label, amount }) => `${label} & ${amount || 0}`)
    .join("\\\\\n") || "No pre-tax deductions"
} \\\\
\\midrule
\\textbf{Taxable Pay} & ${payslip.payeInfo.taxablePay} \\\\
\\midrule
\\textbf{Gross Tax} & ${payslip.payeInfo.grossTax} \\\\
\\textbf{Personal Relief} & ${payslip.payeInfo.personalRelief} \\\\
\\textbf{Insurance Relief} & ${payslip.payeInfo.insuranceRelief} \\\\
\\textbf{Housing Levy Relief} & ${payslip.payeInfo.housingLevyRelief} \\\\
\\textbf{PAYE} & ${payslip.payeInfo.paye} \\\\
\\bottomrule
\\end{tabular}

\\vspace{0.5cm}

\\begin{tabular}{p{2.5in} p{2in}}
\\toprule
\\textbf{Created On:} & ${payslip.createdOn} \\\\
\\textbf{CreatedBy:} & ${payslip.createdBy} \\\\
\\bottomrule
\\end{tabular}

\\end{document}
      `;

          const latexFile = `payslip_${safePayslip.fullName.replace(
            /[^a-zA-Z0-9]/g,
            "_"
          )}.tex`;
          await fsPromises.writeFile(latexFile, latexContent); // Use fsPromises for async write

          const pdfProcess = spawn("latexmk", ["-pdf", latexFile]);
          let pdfOutput = "";
          let pdfError = "";

          pdfProcess.stdout.on("data", (data) => {
            pdfOutput += data.toString();
            console.log(`latexmk output: ${data}`);
          });
          pdfProcess.stderr.on("data", (data) => {
            pdfError += data.toString();
            console.log(`latexmk error: ${data}`);
          });

          const exitCode = await new Promise((resolve, reject) => {
            pdfProcess.on("close", (code) => resolve(code));
            pdfProcess.on("error", (err) => reject(err));
          });

          if (exitCode !== 0 || pdfError) {
            throw new Error(
              `LaTeX compilation failed for ${latexFile}: Exit code ${exitCode}, Error: ${pdfError}`
            );
          }

          const pdfFile = `payslip_${safePayslip.fullName.replace(
            /[^a-zA-Z0-9]/g,
            "_"
          )}.pdf`;
          if (!fs.existsSync(pdfFile)) {
            throw new Error(
              `PDF file not generated: ${pdfFile}. Output: ${pdfOutput}, Error: ${pdfError}`
            );
          }

          return {
            filename: pdfFile,
            path: pdfFile,
          };
        } catch (error) {
          console.error(`Error processing payslip for ${employeeId}:`, error);
          throw error; // Re-throw to be caught by outer try-catch
        }
      });

      pdfFiles = await Promise.all(pdfPromises);

      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=payslips_${companyId}_${payrollId}.zip`
      );

      const archive = archiver("zip", {
        zlib: { level: 9 },
      });
      archive.pipe(res);

      pdfFiles.forEach((file) => {
        if (fs.existsSync(file.path)) {
          archive.append(fs.createReadStream(file.path), {
            name: file.filename,
          });
        } else {
          console.error(`File not found: ${file.path}`);
        }
      });

      console.log(
        "Files added to archive:",
        pdfFiles.map((f) => f.path)
      );
      archive.finalize();

      archive.on("error", (err) => {
        res.status(500).json({ error: err.message });
        cleanupFiles(pdfFiles);
      });

      archive.on("finish", () => cleanupFiles(pdfFiles));
    } catch (error) {
      console.error("Error downloading payslips:", error);
      cleanupFiles(pdfFiles);
      return res.status(500).json({
        success: false,
        message: "Failed to download payslips",
        error: error.message,
      });
    }
  }
}

function cleanupFiles(pdfFiles) {
  if (pdfFiles) {
    pdfFiles.forEach((file) => {
      fs.unlink(file.path, (err) => {
        if (err) console.error(`Error cleaning up ${file.path}:`, err);
      });
    });
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

module.exports = new PayrollController();
