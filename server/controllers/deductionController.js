const { Deduction, Employee, sequelize } = require('../models');
const { EmployeeDeduction } = require('../models/deductionsModel'); // If using separate model files
const { Op } = require('sequelize');

// Create Company-Level Deduction
exports.createDeduction = async (req, res) => {
    try {
        const { companyId, deductionType, calculationMethod, mode, status, isTaxable} = req.body;

        if (!companyId || !deductionType || !calculationMethod) {
            return res.status(400).json({ message: 'companyId, deductionType, and calculationMethod are required' });
        }

        const newDeduction = await Deduction.create({
            companyId,
            deductionType,
            calculationMethod,
            mode: mode || 'monthly', 
            status: status || 'active',
            isTaxable: isTaxable || true,
        });

        res.status(201).json({
            message: 'Deduction created successfully',
            deduction: {
                id: newDeduction.id,
                deductionType: newDeduction.deductionType,
                calculationMethod: newDeduction.calculationMethod,
                mode: newDeduction.mode,
                status: newDeduction.status,
                isTaxable: newDeduction.isTaxable,
                createdAt: newDeduction.createdAt,
                updatedAt: newDeduction.updatedAt
            }
        });
    } catch (error) {
        console.error('Error creating deduction:', error);
        res.status(500).json({
            message: 'Failed to create deduction',
            error: error.errors ? error.errors.map(e => e.message) : error.message
        });
    }
};

// Get All Company Deductions (Deductions) for a Specific Company
exports.getAllCompanyDeductions = async (req, res) => {
    try {
        const { companyId } = req.params; 

        if (!companyId) {
            return res.status(400).json({ 
                message: 'companyId path parameter is required' 
            });
        }

        const deductions = await Deduction.findAll({
            where: {
                companyId,
                deletedAt: null
            },
            attributes: [
                'id', 'deductionType', 
                'calculationMethod','mode','status', 
                'isTaxable', 'createdAt', 'updatedAt'
            ]
        });

        res.status(200).json(deductions);
    } catch (error) {
        console.error('Error fetching company deductions:', error);
        res.status(500).json({ 
            message: 'Failed to fetch company deductions', error: error.message 
        });
    }
};

// Get All Deductions for a Particular Employee
exports.getEmployeeDeductions = async (req, res) => {
    try {
        const { employeeId } = req.params;

        const deductions = await EmployeeDeduction.findAll({
            where: {
                employeeId,
                status: 'active',
                [Op.or]: [
                    { endDate: null },
                    { endDate: { [Op.gte]: new Date() } }
                ]
            },
            include: [{
                model: Deduction,
                as: 'deduction',
                attributes: [
                    'id', 'deductionType', 
                    'calculationMethod', 'status', 'mode',
                ]
            }],
            attributes: ['id', 'customMonthlyAmount', 
                'customPercentage', 'effectiveDate', 
                'endDate', 'calculatedAmount','hourlyRate', 
                'dailyRate', 'weeklyRate'
            ]
        });

        res.status(200).json(deductions);
    } catch (error) {
        console.error('Error fetching employee deductions:', error);
        res.status(500).json({
            message: 'Failed to fetch employee deductions',
            error: error.message
        });
    }
};

// Get Deduction Details by ID
exports.getDeductionById = async (req, res) => {
    try {
        const deduction = await Deduction.findOne({
            where: {
                id: req.params.id,
                deletedAt: null
            },
            include: [{
                model: EmployeeDeduction,
                as: 'employeeDeductions',
                where: { status: 'active' },
                required: false
            }]
        });

        if (!deduction) {
            return res.status(404).json({ 
                message: 'Deduction not found' });
        }

        res.status(200).json(deduction);
    } catch (error) {
        console.error('Error fetching deduction by ID:', error);
        res.status(500).json({ 
            message: 'Failed to fetch deduction', error: error.message 
        });
    }
};

// Update Company-Level Deduction
exports.updateDeduction = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { 
            calculationMethod,
            mode,
            isTaxable,
            status,} = req.body;

        if (!['fixed_amount', 'percentage'].includes(calculationMethod)) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Invalid calculation method' });
        } 

        const deduction = await Deduction.findByPk(id, { transaction });

        if (!deduction) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Deduction not found or already deleted' });
        }

        await deduction.update(
            { status, isTaxable,mode },
            { transaction }
        );

        await transaction.commit();

        res.status(200).json({
            message: 'Deduction updated successfully',
            deduction
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating deduction:', error);
        res.status(500).json({
            message: 'Failed to update deduction',
            error: error.errors ? error.errors.map(e => e.message) : error.message
        });
    }
};

// Soft Delete Deductions Associated to the Company
exports.softDeleteDeduction = async (req, res) => {
    try {
        const { id } = req.params;
        const deduction = await Deduction.findByPk(id);

        if (!deduction) {
            return res.status(404).json({ message: 'Deduction not found' });
        }

        await deduction.destroy(); // Using paranoid delete (soft delete)

        res.status(200).json({ message: 'Deduction soft deleted successfully', deletedAt: deduction.deletedAt });
    } catch (error) {
        console.error('Error soft deleting deduction:', error);
        res.status(500).json({ message: 'Failed to soft delete deduction', error: error.message });
    }
};

// Assign Deduction to Employee
exports.assignToEmployee = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const {
        deductionId,
        employeeId,
        customMonthlyAmount,
        customPercentage,
        customNumberOfHours,
        customHourlyRate,
        customNumberOfDays,
        customDailyRate,
        customNumberOfWeeks,
        customWeeklyRate,
        effectiveDate,
        endDate
      } = req.body;
  
      if (!deductionId || !employeeId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'deductionId and employeeId are required' });
      }
  
    //   const deduction = await getValidDeduction(deductionId, transaction);
    const deduction = await Deduction.findOne({ 
        where: { id: deductionId, 
          status: 'active', 
          deletedAt: null }, 
          transaction });
      if (!deduction) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Deduction not found' });
      }

      if (deduction.calculationMethod === 'fixed_amount' && deduction.mode === 'monthly' && customMonthlyAmount === undefined) {
        await transaction.rollback();
        return res.status(400).json({ message: 'customMonthlyAmount is required for monthly fixed deductions' });
      }
  
      if (deduction.calculationMethod === 'percentage' && customPercentage === undefined) {
        await transaction.rollback();
        return res.status(400).json({ message: 'customPercentage is required for percentage deductions' });
      }
  
    //   const employee = await getValidEmployee(employeeId, transaction);
    const data = {
        employeeId,
        deductionId,
        effectiveDate: effectiveDate || new Date(),
        endDate,
        status: 'active',
        customMonthlyAmount,
        customPercentage,
        customNumberOfHours,
        customHourlyRate,
        customNumberOfWeeks,
        customWeeklyRate,
        customNumberOfDays,
        customDailyRate,
      };
    
      const [employeeDeduction, created] = await EmployeeDeduction.upsert(data, {
        employeeId,
        deductionId,
        customMonthlyAmount,
        customPercentage,
        customNumberOfHours,
        customHourlyRate,
        customNumberOfDays,
        customDailyRate,
        customNumberOfWeeks,
        customWeeklyRate,
        effectiveDate: effectiveDate || new Date(),
        endDate,
        status: 'active'
      }, {
        where: {
          employeeId,
          deductionId,
          [Op.or]: [
            { endDate: null },
            { endDate: { [Op.gte]: new Date() } }
          ]
        },
        transaction
      });
  
      await transaction.commit();
  
      res.status(created ? 201 : 200).json({
        message: created ? 'Deduction assigned to employee' : 'Employee deduction updated',
        employeeDeduction
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error assigning deduction to employee:', error);
      res.status(500).json({
        message: 'Failed to assign deduction to employee',
        error: error.errors ? error.errors.map(e => e.message) : error.message
      });
    }
  };
// Update Employee Deduction
exports.updateEmployeeDeduction = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { 
            customMonthlyAmount, 
            customPercentage, 
            status, 
            effectiveDate, 
            endDate 
        } = req.body;

        const employeeDeduction = await EmployeeDeduction.findByPk(id, {
            include: [{
                model: Deduction,
                as: 'deduction',
                required: true
            }],
            transaction
        });

        if (!employeeDeduction) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Employee deduction not found' });
        }

        if (employeeDeduction.deduction.calculationMethod === 'fixed_amount' && customMonthlyAmount === undefined) {
            await transaction.rollback();
            return res.status(400).json({ message: 'customMonthlyAmount is required for fixed_amount deductions' });
        }
        if (employeeDeduction.deduction.mode === 'hourly' && customHourlyRate === undefined) {
            await transaction.rollback();
            return res.status(400).json({ message: 'customHourlyRate is required for hourly deductions' });
        }
        if (employeeDeduction.deduction.mode === 'daily' && customDailyRate === undefined) {
            await transaction.rollback();
            return res.status(400).json({ message: 'customDailyRate is required for daily deductions' });
        }
        if (employeeDeduction.deduction.mode === 'weekly' && customWeeklyRate === undefined) {
            await transaction.rollback();
            return res.status(400).json({ message: 'customWeeklyRate is required for weekly deductions' });
        }
        if (employeeDeduction.deduction.mode === 'hourly' && customNumberOfHours === undefined) {
            await transaction.rollback();
            return res.status(400).json({ message: 'customNumberOfHours is required for hourly deductions' });
        }
        if (employeeDeduction.deduction.mode === 'daily' && customNumberOfDays === undefined) {
            await transaction.rollback();
            return res.status(400).json({ message: 'customNumberOfDays is required for daily deductions' });
        }   
        if (employeeDeduction.deduction.mode === 'weekly' && customNumberOfWeeks === undefined) {
            await transaction.rollback();
            return res.status(400).json({ message: 'customNumberOfWeeks is required for weekly deductions' });
        }
        if (employeeDeduction.deduction.mode === 'monthly' && customMonthlyAmount === undefined) {
            await transaction.rollback();
            return res.status(400).json({ message: 'customMonthlyAmount is required for monthly deductions' });
        }
        if (employeeDeduction.deduction.calculationMethod === 'percentage' && customPercentage === undefined) {
            await transaction.rollback();
            return res.status(400).json({ message: 'customPercentage is required for percentage deductions' });
        }

        const updatedData = {
            customMonthlyAmount,
            customHourlyRate,
            customDailyRate,
            customWeeklyRate,
            customNumberOfHours,
            customNumberOfDays,
            customNumberOfWeeks,
            customPercentage,
            status,
            effectiveDate,
            endDate
        };

        await EmployeeDeduction.update(updatedData, {
            where: { id },
            transaction
        });

        const updatedEmployeeDeduction = await EmployeeDeduction.findByPk(id, { transaction });

        await transaction.commit();

        res.status(200).json({
            message: 'Employee deduction updated successfully',
            employeeDeduction: updatedEmployeeDeduction
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating employee deduction:', error);
        res.status(500).json({
            message: 'Failed to update employee deduction',
            error: error.errors ? error.errors.map(e => e.message) : error.message
        });
    }
};

// Update Specific Deduction of an Employee
exports.updateEmployeeSpecificDeduction = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;

        const {
            customMonthlyAmount,
            customPercentage,
            status,
            effectiveDate,
            endDate,
            calculatedAmount,
            deductionId,
            employeeId
        } = req.body;

        const employeeDeduction = await EmployeeDeduction.findByPk(id, {
            include: [{ 
                model: Deduction, as: 'deduction', 
                required: true 
            }],
            transaction
        });

        if (!employeeDeduction) {
            await transaction.rollback();
            return res.status(404).json({ 
                message: 'Employee specific deduction not found' 
            });
        }

        // Disallow updates to restricted fields
        if (deductionId || employeeId) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Cannot update deductionId or employeeId.' });
        }

        if (calculatedAmount !== undefined) {
            await transaction.rollback();
            return res.status(400).json({ message: 'calculatedAmount is auto-calculated and cannot be manually updated.' });
        }

        if (employeeDeduction.deduction.calculationMethod === 'fixed_amount' && customMonthlyAmount === undefined) {
            await transaction.rollback();
            return res.status(400).json({ message: 'customMonthlyAmount is required for fixed_amount deductions' });
        }

        if (employeeDeduction.deduction.calculationMethod === 'percentage' && customPercentage === undefined) {
            await transaction.rollback();
            return res.status(400).json({ message: 'customPercentage is required for percentage deductions' });
        }

        const updateFields = {
            customMonthlyAmount,
            customPercentage,
            status,
            effectiveDate,
            endDate
        };

        await employeeDeduction.update(updateFields, { transaction });

        await transaction.commit();

        res.status(200).json({
            message: 'Employee specific deduction updated successfully',
            employeeDeduction
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating employee specific deduction:', error);
        res.status(500).json({
            message: 'Failed to update employee specific deduction',
            error: error.errors ? error.errors.map(e => e.message) : error.message
        });
    }
};


// Delete Specific Deduction of an Employee (Soft Delete)
exports.deleteEmployeeSpecificDeduction = async (req, res) => {
    try {
        const { id } = req.params; // ID of the EmployeeDeduction record

        const employeeDeduction = await EmployeeDeduction.findByPk(id);

        if (!employeeDeduction) {
            return res.status(404).json({ message: 'Employee specific deduction not found' });
        }

        await employeeDeduction.destroy(); // Using paranoid delete (soft delete)

        res.status(200).json({ message: 'Employee specific deduction deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee specific deduction:', error);
        res.status(500).json({ message: 'Failed to delete employee specific deduction', error: error.message });
    }
};

// Filter Employees' Deductions by Type, Status, Calculation Method, etc.
exports.filterEmployeeDeductions = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { type, status, calculationMethod } = req.query;
        const whereClause = {
            employeeId,
            status: 'active',
            [Op.or]: [
                { endDate: null },
                { endDate: { [Op.gte]: new Date() } }
            ]
        };
        const deductionWhereClause = { deletedAt: null };

        if (type) {
            deductionWhereClause.deductionType = { [Op.iLike]: `%${type}%` };
        }
        if (status) {
            deductionWhereClause.status = status;
        }
        if (calculationMethod) {
            deductionWhereClause.calculationMethod = calculationMethod;
        }

        const deductions = await EmployeeDeduction.findAll({
            where: whereClause,
            include: [{
                model: Deduction,
                as: 'deduction',
                where: deductionWhereClause,
                attributes: ['id', 'deductionType', 'calculationMethod', 'status']
            }],
            attributes: ['id', 'customMonthlyAmount', 'customPercentage', 'effectiveDate', 'endDate', 'calculatedAmount']
        });

        res.status(200).json(deductions);
    } catch (error) {
        console.error('Error filtering employee deductions:', error);
        res.status(500).json({ message: 'Failed to filter employee deductions', error: error.message });
    }
};

// Get a List of All Employees with Their Associated Deductions
exports.getAllEmployeesWithDeductions = async (req, res) => {
    try {
        const employees = await Employee.findAll({
            include: [{
                model: EmployeeDeduction,
                as: 'employeeDeductions',
                where: {
                    status: 'active',
                    [Op.or]: [
                        { endDate: null },
                        { endDate: { [Op.gte]: new Date() } }
                    ]
                },
                include: [{
                    model: Deduction,
                    as: 'deduction',
                    attributes: ['id', 'deductionType', 'calculationMethod', 'status', 'mode']
                }],
                attributes: ['id', 'customMonthlyAmount', 
                    'customPercentage', 'effectiveDate', 
                    'endDate', 'calculatedAmount','customHourlyRate', 
                  'customWeeklyRate', 'customDailyRate',
                  'customNumberOfHours', 'customNumberOfDays', 
                  'customNumberOfWeeks'
                ]
            }],
            attributes: ['id', 'firstName', 'lastName', 'staffNo', 'basicSalary'] 
        });

        res.status(200).json(employees);
    } catch (error) {
        console.error('Error fetching employees with their deductions:', error);
        res.status(500).json({ message: 'Failed to fetch employees with their deductions', error: error.message });
    }
};

// Get All Deductions (Regardless of Company)
exports.getAllSystemDeductions = async (req, res) => {
    try {
        const deductions = await Deduction.findAll({
            where: { deletedAt: null },
            attributes: ['id', 'deductionType', 'calculationMethod', 
                'status', 'mode', 'createdAt', 'updatedAt', 'companyId']
        });

        res.status(200).json(deductions);
    } catch (error) {
        console.error('Error fetching all system deductions:', error);
        res.status(500).json({ message: 'Failed to fetch all system deductions', error: error.message });
    }
};

// Get All Employees with Deductions for a Specific Company
// exports.getAllEmployeesWithDeductionsByCompany = async (req, res) => {
//     try {
//         const { companyId } = req.params;

//         if (!companyId) {
//             return res.status(400).json({ message: 'companyId path parameter is required' });
//         }

//         const employees = await Employee.findAll({
//             where: {
//                 companyId,
//                 deletedAt: null
//             },
//             include: [{
//                 model: EmployeeDeduction,
//                 as: 'employeeDeductions',
//                 where: {
//                     status: 'active',
//                     [Op.or]: [
//                         { endDate: null },
//                         { endDate: { [Op.gte]: new Date() }}
//                     ]
//                 },
//                 required: true, // Include employees even if they have no deductions
//                 include: [{
//                     model: Deduction,
//                     as: 'deduction',
//                     where: {
//                         companyId,
//                         deletedAt: null
//                     },
//                     attributes: ['id', 'deductionType', 
//                         'calculationMethod', 'status',
//                         'isTaxable', 'mode'
//                     ]
//                 }],
//                 attributes: ['id', 'customMonthlyAmount', 'customPercentage', 
//                     'effectiveDate', 'endDate', 'calculatedAmount',
//                     'customNumberOfHours', 'customNumberOfDays', 
//                   'customNumberOfWeeks', 'customHourlyRate', 'customDailyRate', 
//                   'customWeeklyRate'
//                 ]
//             }],
//             attributes: ['id', 'firstName', 'lastName', 'staffNo', 'basicSalary']
//         });
//         // Filter out deductions that might be null if required=false was used
//         const result = employees.map(employee => {
//             const employeeData = employee.get({ plain: true });
//             employeeData.employeeDeductions = employeeData.employeeDeductions.filter(
//                 ed => ed.deduction !== null
//             );
//             return employeeData;
//         });

//         res.status(200).json(result);
//     } catch (error) {
//         console.error('Error fetching employees with deductions by company:', error);
//         res.status(500).json({ 
//             message: 'Failed to fetch employees with deductions by company', 
//             error: error.message 
//         });
//     }
// };

exports.getAllEmployeesWithDeductionsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate companyId
    if (!companyId) {
      return res.status(400).json({ message: 'companyId path parameter is required' });
    }

    // Validate and parse date inputs if provided
    const isValidDate = (date) => date instanceof Date && !isNaN(date);
    let employmentDateFilter = {};
    let deductionDateFilter = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (!isValidDate(start) || !isValidDate(end)) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
      }

      if (start > end) {
        return res.status(400).json({ message: "startDate cannot be after endDate." });
      }

      // Apply date filters for employmentDate and effectiveDate
      employmentDateFilter = {
        [Op.gte]: start,
        [Op.lte]: end,
      };
      deductionDateFilter = {
        effectiveDate: {
          [Op.gte]: start,
          [Op.lte]: end,
        },
      };
    }

    // Build the query with aliases
    const employees = await Employee.findAll({
      where: {
        deletedAt: null,
        companyId,
        // Apply employmentDate filter only if dates are provided
        ...(Object.keys(employmentDateFilter).length > 0 && { employmentDate: employmentDateFilter }),
      },
      attributes: [
        'id',
        'firstName',
        'lastName',
        'staffNo',
        'basicSalary',
      ],
      include: [
        {
          model: EmployeeDeduction,
          as: 'employeeDeductions', 
          attributes: [
            'id',
            'customMonthlyAmount',
            'customPercentage',
            'customNumberOfHours',
            'customNumberOfDays',
            'customNumberOfWeeks',
            'customHourlyRate',
            'customDailyRate',
            'customWeeklyRate',
            'calculatedAmount',
            'effectiveDate',
            'endDate',
          ],
          where: {
            ...deductionDateFilter,
            [Op.or]: [
              { endDate: null },
              { endDate: { [Op.gte]: new Date() } },
            ],
            status: 'active',
          },
          required: true, 
          include: [
            {
              model: Deduction,
              as: 'deduction', 
              attributes: [
                'id',
                'deductionType',
                'calculationMethod',
                'isTaxable',
                'status',
                'mode',
              ],
              where: {
                deletedAt: null,
                companyId,
              },
            },
          ],
        },
      ],
    });

    // If no employees are found, return an empty array with a message
    if (!employees.length) {
      return res.status(200).json({
        message: startDate && endDate
          ? 'No employees found within the specified date range.'
          : 'No employees found for the company.',
        data: [],
      });
    }

    // Map the result to ensure plain objects and filter out null deductions
    const result = employees.map(employee => {
      const employeeData = employee.get({ plain: true });
      employeeData.employeeDeductions = employeeData.employeeDeductions.filter(
        ed => ed.deduction !== null
      );
      return employeeData;
    });

    return res.status(200).json({
      message: 'Employees with deductions fetched successfully.',
      data: result,
    });
  } catch (error) {
    console.error('Error fetching employees with deductions by company:', error);
    return res.status(500).json({
      message: 'Failed to fetch employees with deductions by company',
      error: error.message,
    });
  }
};







