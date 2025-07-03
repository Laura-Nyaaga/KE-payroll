const Decimal = require('decimal.js');
const StatutoryService = require('./statutoryService');
const { EmployeeDeduction } = require('../models/deductionsModel');
const { EmployeeEarnings } = require('../models/earningsModel');
const AdvancePay = require('../models/advanceModel');
const { Deduction, Earnings } = require('../models');
const { Op } = require('sequelize');
const { personalRelief } = require('../config/statutoryRates');

class PayrollCalculationService {
  constructor() {
    this.statutory = StatutoryService;
  }

  async calculateEmployeePayroll(employee, payrollPeriod) {
    // Validate employee data
    if (!employee || !employee.basicSalary) {
      throw new Error(`Employee ${employee?.firstName || 'Unknown'} does not have a basic salary.`);
    }

    const basicSalary = new Decimal(employee.basicSalary || 0); // Fallback to 0 if undefined

    const deductions = await this.calculateDeductions(employee.id, payrollPeriod) || [];
    const totalDeductions = deductions.reduce((sum, d) => {
      const amount = new Decimal(d.amount || 0); // Ensure amount is a valid number
      return sum.plus(amount);
    }, new Decimal(0));

    const earnings = await this.calculateEarnings(employee.id, payrollPeriod) || [];
    const totalEarnings = earnings.reduce((sum, e) => {
      const amount = new Decimal(e.amount || 0); // Ensure amount is a valid number
      return sum.plus(amount);
    }, new Decimal(0));

    const grossPay = basicSalary.plus(totalEarnings);

    // Safely handle statutory calculations with fallbacks
    const nssf = new Decimal(this.statutory.calculateNssf(grossPay) || 0);
    const housingLevy = new Decimal(this.statutory.calculateHousingLevy(grossPay) || 0);
    const shif = new Decimal(this.statutory.calculateShif(grossPay) || 0);

    const taxableIncome = grossPay.minus(nssf).minus(housingLevy).minus(shif);
    // console.log(`Taxable Income for ${employee.firstName}:`, taxableIncome.toNumber());


    const personalRelief = 2400.00; // Fallback for personalRelief
    // console.log(`Personal Relief for ${employee.firstName}:`, personalRelief);
    const payeDetails = this.statutory.calculatePaye(taxableIncome, personalRelief) || { paye: new Decimal(0), relief: personalRelief };
    // console.log(`Paye Details for ${employee.firstName}:`, payeDetails);
    const paye = new Decimal(payeDetails.paye || 0);
    // console.log(`PAYE for ${employee.firstName}:`, paye.toNumber());

    const totalStatutory = nssf.plus(housingLevy).plus(shif).plus(paye);
    const allDeductions = totalDeductions.plus(totalStatutory)


    const grossTax = paye.plus(personalRelief);
    // console.log(`Gross Tax for ${employee.firstName}:`, grossTax.toNumber());

    const netPaye = grossPay.minus(totalStatutory).minus(totalDeductions);
    // console.log(`Net Paye for ${employee.firstName}:`, netPaye.toNumber());

    const statutory = {
      nssf: Number(nssf.toFixed(2)),
      housingLevy: Number(housingLevy.toFixed(2)),
      shif: Number(shif.toFixed(2)),
      paye: Number(paye.toFixed(2)),
      personalRelief: personalRelief.toFixed(2),
      total: Number(totalStatutory.toFixed(2)),
    };

    return {
      basicSalary: basicSalary.toNumber(),
      deductions,
      totalDeductions: totalDeductions.toNumber(),
      earnings,
      totalEarnings: totalEarnings.toNumber(),
      grossPay: grossPay.toNumber(),
      taxableIncome: taxableIncome.toNumber(),
      statutory,
      totalStatutory: totalStatutory.toNumber(),
      allDeductions: allDeductions.toNumber(),
      netPaye: netPaye.toNumber(),
      paye: paye.toNumber(),
      grossTax: grossTax.toNumber(),
      personalRelief: personalRelief,
      paymentMethod: employee.methodOfPayment,
      paymentAmount: netPaye.toDecimalPlaces(2).toNumber(),
      currency: employee.currency || 'KES',
    };
  }

  async calculateDeductions(employeeId, payrollPeriod) {
    const deductions = await EmployeeDeduction.findAll({
      where: {
        employeeId,
        status: 'active',
        effectiveDate: {
          [Op.gte]: payrollPeriod.start,
          [Op.lte]: payrollPeriod.end,
        },
        [Op.or]: [
          { endDate: null },
          {
            endDate: {
              [Op.gte]: payrollPeriod.start,
              [Op.lte]: payrollPeriod.end,
            },
          },
        ],
      },
      include: [{
        model: Deduction,
        as: 'deduction',
        where: { status: 'active' },
      }],
    }) || [];

    return deductions.map(ed => ({
      itemType: 'deduction',
      itemName: ed.deduction?.deductionType || 'Unknown Deduction',
      amount: Number(ed.calculatedAmount) || 0,
      isTaxable: ed.deduction?.isTaxable || false,
      status: ed.deduction?.status || 'inactive',
    }));
  }

  async calculateEarnings(employeeId, payrollPeriod) {
    const earnings = await EmployeeEarnings.findAll({
      where: {
        employeeId,
        status: 'active',
        effectiveDate: {
          [Op.gte]: payrollPeriod.start,
          [Op.lte]: payrollPeriod.end,
        },
        [Op.or]: [
          { endDate: null },
          {
            endDate: {
              [Op.gte]: payrollPeriod.start,
              [Op.lte]: payrollPeriod.end,
            },
          },
        ],
      },
      include: [{
        model: Earnings,
        as: 'earnings',
        where: { status: 'active' },
      }],
    }) || [];

    return earnings.map(ee => ({
      itemType: 'earnings',
      itemName: ee.earnings?.earningsType || 'Unknown Earnings',
      amount: Number(ee.calculatedAmount) || 0,
      isTaxable: ee.earnings?.isTaxable || false,
      status: ee.earnings?.status || 'inactive',
    }));
  }
  async generateSummary(payrollData) {
    const summary = {
      totalEmployees: Object.keys(payrollData).length,
      totalBasic: 0,
      totalDeductions: 0,
      allDeductions: 0,
      totalEarnings: 0,
      totalGross: 0,
      totalTaxable: 0,
      totalStatutory: {
        nssf: 0,
        shif: 0,
        housingLevy: 0,
        paye: 0,
        personalRelief: 0,
        total: 0
      },
      totalGrossTax: 0,
      totalNet: 0
    };

    for (const employeeId in payrollData) {
      const data = payrollData[employeeId];
      summary.totalBasic += data.basicSalary;
      summary.totalDeductions += data.totalDeductions;
      summary.allDeductions += data.allDeductions;
      summary.totalEarnings += data.totalEarnings;
      summary.totalGross += data.grossPay;
      summary.totalTaxable += data.taxableIncome;
      summary.totalStatutory.nssf += data.statutory.nssf;
      summary.totalStatutory.shif += data.statutory.shif;
      summary.totalStatutory.housingLevy += data.statutory.housingLevy;
      summary.totalStatutory.paye += data.statutory.paye;
      summary.totalStatutory.personalRelief += data.statutory.personalRelief;
      summary.totalStatutory.total += data.statutory.total;
      summary.totalGrossTax += data.grossTax;
      summary.totalNet += data.netPaye;
    }

    return summary;
  }

  createEmptySummaryGroup() {
    return {
      count: 0,
      totalBasic: 0,
      totalDeductions: 0,
      allDeductions: 0,
      totalEarnings: 0,
      totalGross: 0,
      totalTaxable: 0,
      totalStatutory: {
        nssf: 0,
        shif: 0,
        housingLevy: 0,
        paye: 0,
        personalRelief: 0,
        total: 0
      },
      totalGrossTax: 0,
      totalNet: 0
    };
  }

  addToSummaryGroup(group, data) {
    group.count++;
    group.totalBasic += data.basicSalary;
    group.totalDeductions += data.totalDeductions;
    group.allDeductions += data.allDeductions;
    group.totalEarnings += data.totalEarnings;
    group.totalGross += data.grossPay;
    group.totalTaxable += data.taxableIncome;
    group.totalStatutory.nssf += data.statutory.nssf;
    group.totalStatutory.shif += data.statutory.shif;
    group.totalStatutory.housingLevy += data.statutory.housingLevy;
    group.totalStatutory.paye += data.statutory.paye;
    group.totalStatutory.personalRelief += data.statutory.personalRelief;
    group.totalStatutory.total += data.statutory.total;
    group.totalGrossTax += data.grossTax;
    group.totalNet += data.netPaye;
  }
}

module.exports = new PayrollCalculationService();





