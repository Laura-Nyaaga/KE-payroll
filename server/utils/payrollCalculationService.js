const Decimal = require('decimal.js');
const StatutoryService = require('./statutoryService');
const { EmployeeDeduction } = require('../models/deductionsModel');
const { EmployeeEarnings } = require('../models/earningsModel');
const AdvancePay = require('../models/advanceModel');
const { Deduction, Earnings} = require('../models');
const { Op } = require('sequelize');

class PayrollCalculationService {
  constructor() {
    this.statutory = StatutoryService;
  }

  async calculateEmployeePayroll(employee, payrollPeriod) {
    if (!employee.basicSalary) {
      throw new Error(`Employee ${employee.firstName} does not have a basic salary.`);
    }

    const basicSalary = new Decimal(employee.basicSalary);

    const deductions = await this.calculateDeductions(employee.id, payrollPeriod);

    const totalDeductions = deductions.reduce((sum, d) => sum.plus(new Decimal(d.amount)), new Decimal(0));

    const earnings = await this.calculateEarnings(employee.id, payrollPeriod);

    const totalEarnings = earnings.reduce((sum, e) => sum.plus(new Decimal(e.amount)), new Decimal(0));

    const grossPay = basicSalary.plus(totalEarnings);

    const nssf = this.statutory.calculateNssf(grossPay);
    const housingLevy = this.statutory.calculateHousingLevy(grossPay);
    const shif = this.statutory.calculateShif(grossPay);

    const taxableIncome = grossPay.minus(nssf).minus(housingLevy).minus(shif);

    const payeDetails = this.statutory.calculatePaye(taxableIncome, employee.personalRelief);

    const totalStatutory = nssf.plus(housingLevy).plus(shif).plus(payeDetails.paye);

    const netPaye = grossPay.minus(totalStatutory).minus(totalDeductions);
    // console.log(`Net Paye for ${employee.firstName} ${employee.lastName}:`, netPaye.toNumber());

    const statutory = {
        nssf: Number(nssf.toFixed(2)),
        housingLevy: Number(housingLevy.toFixed(2)),
        shif: Number(shif.toFixed(2)),
        paye: Number(payeDetails.paye.toFixed(2)),
        total: Number(totalStatutory.toFixed(2))
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
      netPaye: netPaye.toNumber(),
      paye: payeDetails.paye.toNumber(),
      personalRelief: payeDetails.relief.toNumber(),
      paymentMethod: employee.methodOfPayment,
      paymentAmount: netPaye.toDecimalPlaces(2).toNumber(),
      currency: employee.currency || 'KES'
    };
  }

  async calculateDeductions(employeeId, payrollPeriod) {
    const deductions = await EmployeeDeduction.findAll({
      where: {
        employeeId,
        status: 'active',
        effectiveDate: {
          [Op.gte]: payrollPeriod.start,
          [Op.lte]: payrollPeriod.end
        },
        [Op.or]: [
          { endDate: null },
          {
            endDate: {
              [Op.gte]: payrollPeriod.start,
              [Op.lte]: payrollPeriod.end
            }
          }
        ]
      },
      include: [{
        model: Deduction,
        as: 'deduction',
        where: { status: 'active' }
      }]
    });

    return deductions.map(ed => ({
      itemType: 'deduction',
      itemName: ed.deduction.deductionType,
      amount: Number(ed.calculatedAmount) || 0,
      isTaxable: ed.deduction.isTaxable,
      status: ed.deduction.status
    }));
  }

  async calculateEarnings(employeeId, payrollPeriod) {
    const earnings = await EmployeeEarnings.findAll({
      where: {
        employeeId,
        status: 'active',
        effectiveDate: {
          [Op.gte]: payrollPeriod.start,
          [Op.lte]: payrollPeriod.end
        },
        [Op.or]: [
          { endDate: null },
          {
            endDate: {
              [Op.gte]: payrollPeriod.start,
              [Op.lte]: payrollPeriod.end
            }
          }
        ]
      },
      include: [{
        model: Earnings,
        as: 'earnings',
        where: { status: 'active' }
      }]
    });

    return earnings.map(ee => ({
      itemType: 'earnings',
      itemName: ee.earnings.earningsType,
      amount: Number(ee.calculatedAmount || 0),
      isTaxable: ee.earnings.isTaxable,
      status: ee.earnings.status
    }));
  }

  async generateSummary(payrollData) {
    const summary = {
      totalEmployees: Object.keys(payrollData).length,
      totalBasic: 0,
      totalDeductions: 0,
      totalEarnings: 0,
      totalGross: 0,
      totalTaxable: 0,
      totalStatutory: {
        nssf: 0,
        shif: 0,
        housingLevy: 0,
        paye: 0,
        total: 0
      },
      totalNet: 0
    };

    for (const employeeId in payrollData) {
      const data = payrollData[employeeId];
      summary.totalBasic += data.basicSalary;
      summary.totalDeductions += data.totalDeductions;
      summary.totalEarnings += data.totalEarnings;
      summary.totalGross += data.grossPay;
      summary.totalTaxable += data.taxableIncome;
      summary.totalStatutory.nssf += data.statutory.nssf;
      summary.totalStatutory.shif += data.statutory.shif;
      summary.totalStatutory.housingLevy += data.statutory.housingLevy;
      summary.totalStatutory.paye += data.statutory.paye;
      summary.totalStatutory.total += data.statutory.total;
      summary.totalNet += data.netPaye;
    }

    return summary;
  }

  createEmptySummaryGroup() {
    return {
      count: 0,
      totalBasic: 0,
      totalDeductions: 0,
      totalEarnings: 0,
      totalGross: 0,
      totalTaxable: 0,
      totalStatutory: {
        nssf: 0,
        shif: 0,
        housingLevy: 0,
        paye: 0,
        total: 0
      },
      totalNet: 0
    };
  }

  addToSummaryGroup(group, data) {
    group.count++;
    group.totalBasic += data.basicSalary;
    group.totalDeductions += data.totalDeductions;
    group.totalEarnings += data.totalEarnings;
    group.totalGross += data.grossPay;
    group.totalTaxable += data.taxableIncome;
    group.totalStatutory.nssf += data.statutory.nssf;
    group.totalStatutory.shif += data.statutory.shif;
    group.totalStatutory.housingLevy += data.statutory.housingLevy;
    group.totalStatutory.paye += data.statutory.paye;
    group.totalStatutory.total += data.statutory.total;
    group.totalNet += data.netPaye;
  }
}

module.exports = new PayrollCalculationService();



// const StatutoryService = require('./statutoryService');
// const { EmployeeDeduction } = require('../models/deductionsModel');
// const { EmployeeEarnings } = require('../models/earningsModel');
// const AdvancePay = require('../models/advanceModel');
// const { Deduction, Earnings, Employee } = require('../models');
// const { Op } = require('sequelize');

// class PayrollCalculationService {
//     constructor() {
//         this.statutory = StatutoryService;
//     }

//     async calculateEmployeePayroll(employee, payrollPeriod, companyCountryCode) {
//         if (!employee.basicSalary) {
//             throw new Error(`Employee ${employee.firstName} does not have a basic salary.`);
//         }

//         const basicSalary = employee.basicSalary;

//         const deductions = await this.calculateDeductions(employee.id, payrollPeriod);
//         console.log(`Deductions for ${employee.firstName}:`, deductions);

//         const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
//         console.log(`Total Deductions for ${employee.firstName}:`, totalDeductions);


//         const earnings = await this.calculateEarnings(employee.id, payrollPeriod);
//         console.log(`Earnings for ${employee.firstName}:`, earnings);

//         const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
//         console.log(`Total Earnings for ${employee.firstName}:`, totalEarnings);

//         const grossPay = Number(basicSalary || 0) + Number(totalEarnings || 0);
//         console.log(`Gross Pay for ${employee.firstName}:`, grossPay);

//         const nssf = this.statutory.calculateNssf(grossPay);
//         const housingLevy = this.statutory.calculateHousingLevy(grossPay);
//         const shif = this.statutory.calculateShif(grossPay);

//         const taxableIncome = grossPay - (nssf + housingLevy + shif);
//         console.log(`Taxable Income for ${employee.firstName}:`, taxableIncome);

//         const payeDetails = this.statutory.calculatePaye(taxableIncome, employee.personalRelief);

//         const totalStatutory = nssf + housingLevy + shif + payeDetails.paye;
//         console.log(`Total Satutory Deductions for ${employee.firstName}:`, totalStatutory);

//         const statutory = {
//             nssf: parseFloat(nssf.toFixed(2)),
//             housingLevy: parseFloat(housingLevy.toFixed(2)),
//             shif: parseFloat(shif.toFixed(2)),
//             paye: parseFloat(payeDetails.paye.toFixed(2)),
//             // relief: parseFloat(payeDetails.relief.toFixed(2)),
//             total: parseFloat(totalStatutory.toFixed(2))
//         };
        

//         const netPaye = parseFloat(grossPay.toFixed(2) - totalStatutory.toFixed(2) - totalDeductions.toFixed(2));
//         console.log(`Net Paye for ${employee.firstName}:`, netPaye);


//         return {
//             basicSalary,
//             deductions,
//             totalDeductions,
//             earnings,
//             totalEarnings,
//             grossPay,
//             taxableIncome,
//             statutory,
//             totalStatutory,
//             netPaye,
//             paye: parseFloat(payeDetails.paye.toFixed(2)),
//             personalRelief: parseFloat(payeDetails.relief.toFixed(2)),
//             paymentMethod: employee.methodOfPayment,
//             paymentAmount: parseFloat(netPaye.toFixed(2)),
//             currency: employee.currency || 'KES'
//         };
//     }

//     async calculateDeductions(employeeId, payrollPeriod) {
//         const deductions = await EmployeeDeduction.findAll({
//             where: {
//                 employeeId: employeeId,
//                 status: 'active', // Ensures EmployeeDeduction is active
//                 effectiveDate: { 
//                     [Op.gte]: payrollPeriod.start, // Must be on or after payroll start date
//                     [Op.lte]: payrollPeriod.end    // Must be on or before payroll end date
//                 },
//                 [Op.or]: [
//                     { endDate: null }, // If endDate is null, the deduction is still valid
//                     { 
//                         endDate: { 
//                             [Op.gte]: payrollPeriod.start, // Must be on or after payroll start date
//                             [Op.lte]: payrollPeriod.end    // Must be on or before payroll end date
//                         }
//                     }
//                 ]
//             },
//             include: [{
//                 model: Deduction, 
//                 as: 'deduction',
//                 where: { status: 'active' } // Ensures Deduction itself is active
//             }]
//         });
    
//         return deductions.map(ed => ({
//             itemType: 'deduction',
//             itemName: ed.deduction.deductionType,
//             amount: Number(ed.calculatedAmount) || 0,
//             isTaxable: ed.deduction.isTaxable,
//             status: ed.deduction.status
//         }));
//     }
    

//     async calculateEarnings(employeeId, payrollPeriod) {
//         const earnings = await EmployeeEarnings.findAll({
//             where: {
//                 employeeId: employeeId,
//                 status: 'active', // Ensures EmployeeEarnings is active
//                 effectiveDate: { 
//                     [Op.gte]: payrollPeriod.start, // Must be on or after payroll start date
//                     [Op.lte]: payrollPeriod.end 
//                 },
//                 [Op.or]: [
//                     { endDate: null },
//                     { 
//                         endDate: { 
//                         [Op.gte]: payrollPeriod.start,
//                         [Op.lte]: payrollPeriod.end    // Must be on or before payroll end date
//                         } 
//                     }
//                 ]
//             },
//             include: [{ 
//                 model: Earnings, as: 'earnings',
//                 where: { status: 'active' }
//             }]
//         });
//         return earnings.map(ee => ({
//             itemType: 'earnings',
//             itemName: ee.earnings.earningsType,
//             amount: Number(ee.calculatedAmount || 0),
//             isTaxable: ee.earnings.isTaxable,
//             status: ee.earnings.status
//         }));
//     }

//     async generateSummary(payrollData) {
//         const summary = {
//             totalEmployees: Object.keys(payrollData).length,
//             totalBasic: 0,
//             totalDeductions: 0,
//             totalEarnings: 0,
//             totalGross: 0,
//             totalTaxable: 0,
//             totalStatutory: {
//                 nssf: 0,
//                 shif: 0,
//                 housingLevy: 0,
//                 paye: 0,
//                 total: 0
//             },
//             totalNet: 0,
//             byDepartment: {},
//             byJobTitle: {}
//         };

//         for (const employeeId in payrollData) {
//             const data = payrollData[employeeId];
//             summary.totalBasic += data.basicSalary;
//             summary.totalDeductions += data.totalDeductions;
//             summary.totalEarnings += data.earnings.reduce((sum, e) => sum + e.amount, 0);
//             summary.totalGross += data.grossPay;
//             summary.totalTaxable += data.taxableIncome;
//             summary.totalStatutory.nssf += data.statutory.nssf;
//             summary.totalStatutory.shif += data.statutory.shif;
//             summary.totalStatutory.housingLevy += data.statutory.housingLevy;
//             summary.totalStatutory.paye += data.statutory.paye;
//             summary.totalStatutory.total += data.statutory.nssf + data.statutory.shif +
//                                             data.statutory.housingLevy + data.statutory.paye;
//             summary.totalNet += data.netPaye;
//         }

//         return summary;
//     }

//     createEmptySummaryGroup() {
//         return {
//             count: 0,
//             totalBasic: 0,
//             totalDeductions: 0,
//             totalEarnings: 0,
//             totalGross: 0,
//             totalTaxable: 0,
//             totalStatutory: {
//                 nssf: 0,
//                 shif: 0,
//                 housingLevy: 0,
//                 paye: 0,
//                 total: 0
//             },
//             totalNet: 0
//         };
//     }

//     addToSummaryGroup(group, data) {
//         group.count++;
//         group.totalBasic += data.basicSalary;
//         group.totalDeductions += data.totalDeductions;
//         group.totalEarnings += data.earnings.reduce((sum, e) => sum + e.amount, 0);
//         group.totalGross += data.grossPay;
//         group.totalTaxable += data.taxableIncome;
//         group.totalStatutory.nssf += data.statutory.nssf;
//         group.totalStatutory.shif += data.statutory.shif;
//         group.totalStatutory.housingLevy += data.statutory.housingLevy;
//         group.totalStatutory.paye += data.statutory.paye;
//         group.totalStatutory.total += data.statutory.nssf + data.statutory.shif +
//                                      data.statutory.housingLevy + data.statutory.paye;
//         group.totalNet += data.netPaye;
//     }
// }

// module.exports = new PayrollCalculationService();


