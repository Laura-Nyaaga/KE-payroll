const { Payroll, PayrollItem } = require("../models/payrollModel");
const { Employee, Company } = require("../models");
const { Op, Sequelize } = require("sequelize");
const PayrollCalculationService = require("../utils/payrollCalculationService");

class PayrollController {
  async getPayrollPreview(req, res) {
    const { companyId } = req.params;
    const { payPeriodStartDate, payPeriodEndDate, paymentDate } = req.body;

    console.log( "These are the received dates:", {
      payPeriodStartDate, 
      payPeriodEndDate,
      paymentDate
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

      const earliestAllowedMonth = earliestAllowedDate.getMonth() + 1;
      const earliestAllowedYear = earliestAllowedDate.getFullYear();

      // Ensure payroll is within the allowed range
      const isTooOld =
        payrollYear < earliestAllowedYear ||
        (payrollYear === earliestAllowedYear &&
          payrollMonth < earliestAllowedMonth);
      const isFutureMonth =
        payrollYear > currentYear ||
        (payrollYear === currentYear && payrollMonth > currentMonth);

      if (isTooOld) {
        return res.status(400).json({
          message: `Payroll for ${payrollDate.toLocaleString("default", {
            month: "long",
          })},
               ${payrollYear} is too far in the past. 
              You can only process payroll for the last three months.`,
        });
      }

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

      // First, auto-reject any pending items older than 3 days
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      await PayrollItem.update(
        {
          payrollStatus: "rejected",
          // rejectionReason: "Automatically rejected after 3 days pending",
          rejectedAt: new Date(),
        },
        {
          where: {
            payrollId,
            payrollStatus: "pending",
            processingDate: { [Op.lt]: threeDaysAgo },
          },
        }
      );

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
              payrollStatus: "approved",
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
  async getRejectedPayroll(req, res) {
    const { companyId } = req.params;
    const { payrollId } = req.body;

    try {
      const payroll = await Payroll.findOne({
        where: { id: payrollId, companyId },
      });

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Rejected payroll not found for this company.",
        });
      }

      const payrollItems = await PayrollItem.findAll({
        where: { payrollId, payrollStatus: "rejected" },
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
            ],
          },
        ],
        order: [["employeeId", "ASC"]],
      });

      if (!payrollItems.length) {
        return res.status(404).json({
          success: false,
          message: "No payroll items found for this rejected batch.",
        });
      }

      // Group items by employee
      const employeeMap = {};

      for (const item of payrollItems) {
        const empId = item.employeeId;
        if (!employeeMap[empId]) {
          const emp = item.employee;
          employeeMap[empId] = {
            employeeId: emp.id,
            staffId: emp.staffNo,
            fullName: `${emp.firstName} ${emp.lastName}`,
            departmentId: emp.departmentId,
            jobTitleId: emp.jobTitleId,
            basicSalary: emp.basicSalary,
            paymentMethod: emp.paymentMethod,
            projectId: emp.projectId,
            employmentType: emp.employmentType,
            grossPay: 0,
            totalEarnings: 0,
            totalDeductions: 0,
            statutory: {},
            netPay: 0,
            taxableIncome: 0,
            earnings: [],
            deductions: [],
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

      const formattedEmployees = Object.values(employeeMap).map((emp) => {
        const statutoryTotal = Object.values(emp.statutory).reduce(
          (sum, val) => sum + val,
          0
        );

        emp.netPay =
          emp.grossPay +
          emp.totalEarnings -
          emp.totalDeductions -
          statutoryTotal;
        emp.taxableIncome = emp.grossPay + emp.totalEarnings;

        return emp;
      });

      return res.status(200).json({
        success: true,
        message: "Rejected payroll retrieved successfully.",
        payrollId: payroll.id,
        payrollStatus: payroll.payrollStatus,
        metadata: {
          companyId,
          payPeriodStartDate: payroll.payPeriodStartDate,
          payPeriodEndDate: payroll.payPeriodEndDate,
          paymentDate: payroll.paymentDate,
          submittedAt: payroll.submittedAt,
          approvalDate: payroll.approvalDate,
          notes: payroll.notes || "No additional details",
        },
        data: formattedEmployees,
      });
    } catch (error) {
      console.error("Error fetching rejected payroll:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch rejected payroll",
        error: error.message,
      });
    }
  }

  async getExpiredPayroll(req, res) {
    const { companyId } = req.params;
    const { payrollId } = req.body;

    try {
      const payroll = await Payroll.findOne({
        where: { id: payrollId, companyId },
      });

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Expired payroll not found for this company.",
        });
      }

      const payrollItems = await PayrollItem.findAll({
        where: { payrollId, payrollStatus: "expired" },
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
            ],
          },
        ],
        order: [["employeeId", "ASC"]],
      });

      if (!payrollItems.length) {
        return res.status(404).json({
          success: false,
          message: "No payroll items found for this expired batch.",
        });
      }

      // Group items by employee
      const employeeMap = {};

      for (const item of payrollItems) {
        const empId = item.employeeId;
        if (!employeeMap[empId]) {
          const emp = item.employee;
          employeeMap[empId] = {
            employeeId: emp.id,
            staffId: emp.staffNo,
            fullName: `${emp.firstName} ${emp.lastName}`,
            departmentId: emp.departmentId,
            jobTitleId: emp.jobTitleId,
            basicSalary: emp.basicSalary,
            paymentMethod: emp.paymentMethod,
            employmentType: emp.employmentType,
            projectId: emp.projectId,
            grossPay: 0,
            totalEarnings: 0,
            totalDeductions: 0,
            statutory: {},
            netPay: 0,
            taxableIncome: 0,
            earnings: [],
            deductions: [],
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

      const formattedEmployees = Object.values(employeeMap).map((emp) => {
        const statutoryTotal = Object.values(emp.statutory).reduce(
          (sum, val) => sum + val,
          0
        );

        emp.netPay =
          emp.grossPay +
          emp.totalEarnings -
          emp.totalDeductions -
          statutoryTotal;
        emp.taxableIncome = emp.grossPay + emp.totalEarnings;

        return emp;
      });

      return res.status(200).json({
        success: true,
        message: "Expired payroll retrieved successfully.",
        payrollId: payroll.id,
        // payrollStatus: payroll.payrollStatus,
        metadata: {
          companyId,
          payPeriodStartDate: payroll.payPeriodStartDate,
          payPeriodEndDate: payroll.payPeriodEndDate,
          paymentDate: payroll.paymentDate,
          expiresAt: payroll.expiresAt,
          submittedAt: payroll.submittedAt,
          notes: payroll.notes || "No additional details",
        },
        data: formattedEmployees,
      });
    } catch (error) {
      console.error("Error fetching expired payroll:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch expired payroll",
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
            // expiresAt: payroll.expiresAt,
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

  async getPayrollSummaryReport(req, res) {
    const { companyId } = req.params;
    const { year } = req.query; // Optional year filter

    try {
      // Find all payrolls for the company, optionally filtered by year
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

      if (!payrolls.length) {
        return res.status(404).json({
          success: false,
          message: "No payroll records found for this company.",
        });
      }

      // Process each payroll to get summary data
      const payrollSummaries = await Promise.all(
        payrolls.map(async (payroll) => {
          // Get all items for this payroll
          const items = await PayrollItem.findAll({
            where: { payrollId: payroll.id },
          });

          // Initialize summary values
          let summary = {
            totalEmployees: 0,
            totalBasicSalary: 0,
            totalGrossPay: 0,
            totalEarnings: 0,
            totalDeductions: 0,
            totalStatutory: 0,
            totalPAYE: 0,
            totalNSSF: 0,
            totalHousingLevy: 0,
            totalTaxableIncome: 0,
            totalNetPay: 0,
            statutoryDetails: {},
          };

          // Group items by employee
          const employeeItems = {};
          items.forEach((item) => {
            if (!employeeItems[item.employeeId]) {
              employeeItems[item.employeeId] = [];
            }
            employeeItems[item.employeeId].push(item);
          });

          summary.totalEmployees = Object.keys(employeeItems).length;

          // Calculate totals for each employee
          Object.values(employeeItems).forEach((empItems) => {
            let empSummary = {
              basicSalary: 0,
              grossPay: 0,
              earnings: 0,
              deductions: 0,
              statutory: 0,
              PAYE: 0,
              NSSF: 0,
              housingLevy: 0,
              taxableIncome: 0,
              netPay: 0,
            };

            empItems.forEach((item) => {
              switch (item.itemType) {
                case "basic_salary":
                  empSummary.basicSalary += Number(item.amount);
                  empSummary.grossPay += Number(item.amount);
                  empSummary.taxableIncome += Number(item.amount);
                  break;
                case "earning":
                  empSummary.earnings += Number(item.amount);
                  empSummary.grossPay += Number(item.amount);
                  if (item.isTaxable) {
                    empSummary.taxableIncome += Number(item.amount);
                  }
                  break;
                case "deduction":
                  empSummary.deductions += Number(item.amount);
                  if (item.isTaxable) {
                    empSummary.taxableIncome -= Number(item.amount);
                  }
                  break;
                case "statutory":
                  empSummary.statutory += Number(item.amount);
                  // Categorize statutory deductions
                  if (item.itemName.toLowerCase().includes("paye")) {
                    empSummary.PAYE += Number(item.amount);
                  } else if (item.itemName.toLowerCase().includes("nssf")) {
                    empSummary.NSSF += Number(item.amount);
                  } else if (item.itemName.toLowerCase().includes("housing")) {
                    empSummary.housingLevy += Number(item.amount);
                  }
                  break;
              }
            });

            empSummary.netPay =
              empSummary.grossPay -
              empSummary.deductions -
              empSummary.statutory;

            // Add employee totals to payroll summary
            summary.totalBasicSalary += empSummary.basicSalary;
            summary.totalGrossPay += empSummary.grossPay;
            summary.totalEarnings += empSummary.earnings;
            summary.totalDeductions += empSummary.deductions;
            summary.totalStatutory += empSummary.statutory;
            summary.totalPAYE += empSummary.PAYE;
            summary.totalNSSF += empSummary.NSSF;
            summary.totalHousingLevy += empSummary.housingLevy;
            summary.totalTaxableIncome += empSummary.taxableIncome;
            summary.totalNetPay += empSummary.netPay;
          });

          // Format the payroll period
          const startMonth = payroll.payPeriodStartDate.toLocaleString(
            "default",
            { month: "short" }
          );
          const endMonth = payroll.payPeriodEndDate.toLocaleString("default", {
            month: "short",
          });
          const period =
            payroll.payPeriodStartDate.getFullYear() ===
            payroll.payPeriodEndDate.getFullYear()
              ? `${startMonth} - ${endMonth} ${payroll.payPeriodStartDate.getFullYear()}`
              : `${startMonth} ${payroll.payPeriodStartDate.getFullYear()} - ${endMonth} ${payroll.payPeriodEndDate.getFullYear()}`;

          return {
            payrollId: payroll.id,
            period,
            payPeriodStartDate: payroll.payPeriodStartDate,
            payPeriodEndDate: payroll.payPeriodEndDate,
            paymentDate: payroll.paymentDate,
            payrollStatus: payroll.payrollStatus,
            ...summary,
          };
        })
      );

      return res.status(200).json({
        success: true,
        message: "Payroll summary report generated successfully.",
        data: payrollSummaries,
      });
    } catch (error) {
      console.error("Error generating payroll summary report:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to generate payroll summary report",
        error: error.message,
      });
    }
  }

  async getPayrollBatchDetails(req, res) {
    const { payrollId } = req.params;

    try {
      const payroll = await Payroll.findByPk(payrollId);
      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: "Payroll batch not found.",
        });
      }

      // Get all items for this payroll
      const items = await PayrollItem.findAll({
        where: { payrollId },
        include: [
          {
            model: Employee,
            as: "employee",
            attributes: [
              "id",
              "firstName",
              "lastName",
              "staffNo",
              "departmentId",
              "jobTitleId",
              "mobileNumber",
              "accountName",
              "accountNumber",
              "bankName",
              "branchName",
              "branchCode",
              "bankCode",
            ],
          },
        ],
        order: [["employeeId", "ASC"]],
      });

      if (!items.length) {
        return res.status(404).json({
          success: false,
          message: "No payroll items found in this batch.",
        });
      }

      // Initialize summary
      const summary = {
        totalEmployees: 0,
        totalBasicSalary: 0,
        totalGrossPay: 0,
        totalEarnings: 0,
        totalDeductions: 0,
        totalStatutory: 0,
        totalPAYE: 0,
        totalNSSF: 0,
        totalHousingLevy: 0,
        totalTaxableIncome: 0,
        totalNetPay: 0,
        statutoryDetails: {},
      };

      // Group items by employee and calculate totals
      const employeeMap = {};
      const employeeItems = {};

      items.forEach((item) => {
        if (!employeeItems[item.employeeId]) {
          employeeItems[item.employeeId] = [];
        }
        employeeItems[item.employeeId].push(item);
      });

      summary.totalEmployees = Object.keys(employeeItems).length;

      // Process each employee
      const employeeDetails = Object.entries(employeeItems).map(
        ([empId, empItems]) => {
          const employee = empItems[0].employee;
          const empDetail = {
            employeeId: employee.id,
            staffId: employee.staffNo,
            fullName: `${employee.firstName} ${employee.lastName}`,
            departmentId: employee.departmentId,
            jobTitleId: employee.jobTitleId,
            mobileNumber: employee.mobileNumber,
            accountName: employee.accountName,
            accountNumber: employee.accountNumber,
            bankName: employee.bankName,
            branchName: employee.branchName,
            branchName: employee.branchName,
            branchCode: employee.branchCode,
            basicSalary: 0,
            grossPay: 0,
            earnings: [],
            totalEarnings: 0,
            deductions: [],
            totalDeductions: 0,
            statutory: {},
            totalStatutory: 0,
            PAYE: 0,
            NSSF: 0,
            housingLevy: 0,
            taxableIncome: 0,
            netPay: 0,
          };

          empItems.forEach((item) => {
            switch (item.itemType) {
              case "basic_salary":
                empDetail.basicSalary = Number(item.amount);
                empDetail.grossPay += Number(item.amount);
                empDetail.taxableIncome += Number(item.amount);
                break;
              case "earning":
                empDetail.earnings.push({
                  name: item.itemName,
                  amount: Number(item.amount),
                  isTaxable: item.isTaxable,
                });
                empDetail.totalEarnings += Number(item.amount);
                empDetail.grossPay += Number(item.amount);
                if (item.isTaxable) {
                  empDetail.taxableIncome += Number(item.amount);
                }
                break;
              case "deduction":
                empDetail.deductions.push({
                  name: item.itemName,
                  amount: Number(item.amount),
                  isTaxable: item.isTaxable,
                });
                empDetail.totalDeductions += Number(item.amount);
                if (item.isTaxable) {
                  empDetail.taxableIncome -= Number(item.amount);
                }
                break;
              case "statutory":
                empDetail.statutory[item.itemName] = Number(item.amount);
                empDetail.totalStatutory += Number(item.amount);
                if (item.itemName.toLowerCase().includes("paye")) {
                  empDetail.PAYE += Number(item.amount);
                } else if (item.itemName.toLowerCase().includes("nssf")) {
                  empDetail.NSSF += Number(item.amount);
                } else if (item.itemName.toLowerCase().includes("housing")) {
                  empDetail.housingLevy += Number(item.amount);
                }
                break;
            }
          });

          empDetail.netPay =
            empDetail.grossPay -
            empDetail.totalDeductions -
            empDetail.totalStatutory;

          // Add to summary totals
          summary.totalBasicSalary += empDetail.basicSalary;
          summary.totalGrossPay += empDetail.grossPay;
          summary.totalEarnings += empDetail.totalEarnings;
          summary.totalDeductions += empDetail.totalDeductions;
          summary.totalStatutory += empDetail.totalStatutory;
          summary.totalPAYE += empDetail.PAYE;
          summary.totalNSSF += empDetail.NSSF;
          summary.totalHousingLevy += empDetail.housingLevy;
          summary.totalTaxableIncome += empDetail.taxableIncome;
          summary.totalNetPay += empDetail.netPay;

          return empDetail;
        }
      );

      return res.status(200).json({
        success: true,
        message: "Payroll batch details retrieved successfully.",
        payrollId: payroll.id,
        payrollStatus: payroll.payrollStatus,
        period: {
          start: payroll.payPeriodStartDate,
          end: payroll.payPeriodEndDate,
        },
        paymentDate: payroll.paymentDate,
        summary,
        employees: employeeDetails,
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

      if (!payrolls.length) {
        return res.status(404).json({
          success: false,
          message: "No payroll records found for this company.",
        });
      }

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
}
module.exports = new PayrollController();
