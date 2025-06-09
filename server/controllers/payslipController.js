const { Payslip } = require("../models");
const Employee = require("../models/employeesModel");
const {
  Earnings,
  Allowance,
  Deduction,
  Loan,
  AdvancePay,
} = require("../models");
const softDelete = require("../utils/softDelete");

// GET ALL PAYSLIPS 
exports.getAllPayslips = async (req, res) => {
  try {
    const payslips = await Payslip.findAll({ where: { deletedAt: null } });
    res.status(200).json(payslips);
  } catch (error) {
    console.error("Error fetching payslips:", error);
    res.status(500).json({ message: "Failed to fetch payslips" });
  }
};

// GET PAYSLIP BY ID
exports.getPayslipById = async (req, res) => {
  try {
    const payslip = await Payslip.findByPk(req.params.id, {
      where: { deletedAt: null },
      include: [
        {
          model: Employee,
          attributes: ["firstName", "lastName", "staffNo", "basicSalary"],
        },
        {
          model: Payroll,
          include: [
            {
              model: Earnings,
              attributes: ["earningsType", "amount", "status"],
            },
            {
              model: Allowance,
              attributes: ["allowanceType", "amount", "status"],
            },
            {
              model: Deduction,
              attributes: ["deductionsType", "amount"],
            },
            {
              model: AdvancePay,
              attributes: [
                "advanceAmount",
                "installmentAmount",
                "noOfInstallments",
              ],
            },
            {
              model: Loan,
              attributes: ["loanType", "amount"],
            },
          ],
        },
      ],
    });

    if (!payslip) {
      return res.status(404).json({ message: "Payslip not found" });
    }

    const response = {
      employeeName: `${payslip.Employee.firstName} ${payslip.Employee.lastName}`,
      staffNo: payslip.Employee.staffNo,
      basicSalary: payslip.Employee.basicSalary,
      earnings: payslip.Payroll.Earnings,
      allowances: payslip.Payroll.Allowances,
      deductions: payslip.Payroll.Deductions,
      loans: payslip.Payroll.Loans,
      grossSalary: payslip.Payroll.grossSalary,
      PAYE: payslip.Payroll.PAYE,
      NSSF: payslip.Payroll.NSSF,
      SHIF: payslip.Payroll.SHIF,
      housingLevy: payslip.Payroll.housingLevy,
      netPay: payslip.Payroll.netPay,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching payslip by ID:", error);
    res.status(500).json({ message: "Failed to fetch payslip" });
  }
};

// UPDATE PAYSLIP
exports.updatePayslip = async (req, res) => {
  try {
    const [updatedRows] = await Payslip.update(req.body, {
      where: { id: req.params.id, deletedAt: null },
    });
    if (updatedRows === 0) {
      return res
        .status(404)
        .json({ message: "Payslip not found" });
    }
    const updatedPayslip = await Payslip.findByPk(req.params.id);
    res.status(200).json(updatedPayslip);
  } catch (error) {
    console.error("Error updating payslip:", error);
    res
      .status(500)
      .json({ message: "Failed to update payslip", error: error.errors });
  }
};

// SOFT DELETE
exports.softDeletePayslip = async (req, res) => {
  await softDelete(Payslip, req.params.id, res);
};
