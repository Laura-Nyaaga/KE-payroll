const { Earnings, Employee, sequelize } = require('../models');
const { EmployeeEarnings } = require('../models/earningsModel');
const { Op } = require('sequelize');
const { assignIfDefined } = require('../utils/objectUtils');


// Create Company-Level Earnings
exports.createEarnings = async (req, res) => {
    try {
        const { companyId, earningsType, calculationMethod, isTaxable, mode, status} = req.body;

        if (!companyId || !earningsType || !calculationMethod) {
            return res.status(400).json({ message: 'companyId, earningsType, and calculationMethod are required' });
        }

        const newEarnings = await Earnings.create({
            companyId,
            earningsType,
            calculationMethod,
            mode: mode ||'monthly',
            isTaxable: isTaxable !== false,
            status: status || 'active',
        });

        res.status(201).json({
            message: 'Earnings created successfully',
            earnings: {
                id: newEarnings.id,
                earningsType: newEarnings.earningsType,
                calculationMethod: newEarnings.calculationMethod,
                mode: newEarnings.mode,
                isTaxable: newEarnings.isTaxable,
                status: newEarnings.status,
                createdAt: newEarnings.createdAt,
                updatedAt: newEarnings.updatedAt
            }
        });
    } catch (error) {
        console.error('Error creating earnings:', error);
        res.status(500).json({
            message: 'Failed to create earnings',
            error: error.errors ? error.errors.map(e => e.message) : error.message
        });
    }
};

// Get All Company Earnings (Earnings) for a Specific Company
exports.getAllCompanyEarnings = async (req, res) => {
    try {
        const { companyId } = req.params; 

        if (!companyId) {
            return res.status(400).json({ 
              message: 'companyId path parameter is required' 
            });
        }

        const earnings = await Earnings.findAll({
            where: {
                companyId,
                deletedAt: null
            },
            attributes: [
              'id', 'earningsType', 
              'calculationMethod', 'isTaxable', 
              'status', 'mode', 'createdAt', 'updatedAt'
            ]
        });

        res.status(200).json(earnings);
    } catch (error) {
        console.error('Error fetching company earnings:', error);
        res.status(500).json({ 
          message: 'Failed to fetch company earnings', error: error.message 
        });
    }
};

// Get All Earnings for a Particular Employee
exports.getEmployeeEarnings = async (req, res) => {
    try {
        const { employeeId } = req.params;

        const earnings = await EmployeeEarnings.findAll({
            where: {
                employeeId,
                status: 'active',
                [Op.or]: [
                    { endDate: null },
                    { endDate: { [Op.gte]: new Date() } }
                ]
            },
            include: [{
                model: Earnings,
                as: 'earnings',
                attributes: [
                  'id', 'earningsType', 'calculationMethod', 
                  'isTaxable', 'status','mode' 
                ]
            }],
            attributes: [
              'id', 'customAmount', 
              'customPercentage', 'customHours', 
              'customDays', 'customWeeks', 'effectiveDate', 
              'endDate', 'calculatedAmount','hourlyRate', 
              'dailyRate', 'weeklyRate'
            ]
        });

        res.status(200).json(earnings);
    } catch (error) {
        console.error('Error fetching employee earnings:', error);
        res.status(500).json({
            message: 'Failed to fetch employee earnings',
            error: error.message
        });
    }
};

// Get Earnings Details by ID
exports.getEarningsById = async (req, res) => {
    try {
        const earnings = await Earnings.findOne({
            where: {
                id: req.params.id,
                deletedAt: null
            },
            include: [{
                model: EmployeeEarnings,
                as: 'employeeEarnings',
                where: { status: 'active' },
                required: false
            }]
        });

        if (!earnings) {
            return res.status(404).json({ 
              message: 'Earnings not found' });
        }

        res.status(200).json(earnings);
    } catch (error) {
        console.error('Error fetching earnings by ID:', error);
        res.status(500).json({ 
          message: 'Failed to fetch earnings', error: error.message 
        });
    }
};

// Update Company-Level Earnings
exports.updateEarnings = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const {
        calculationMethod,
        mode,
        isTaxable,
        status,
      } = req.body;
  
      if (!['fixed_amount', 'percentage'].includes(calculationMethod)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Invalid calculation method' });
      }
  
      // if (calculationMethod === 'percentage' && mode !== 'monthly') {
      //   await transaction.rollback();
      //   return res.status(400).json({ message: 'Percentage-based earnings must have "monthly" mode.' });
      // }
  
      const [updatedRows] = await Earnings.update({
        calculationMethod,
        mode,
        isTaxable,
        status
      }, {
        where: {
          id,
          deletedAt: null
        },
        transaction
      });
  
      if (updatedRows === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Earnings not found or already deleted' });
      }
  
      const updatedEarnings = await Earnings.findByPk(id, { transaction });
      await transaction.commit();
  
      res.status(200).json({
        message: 'Earnings updated successfully',
        earnings: updatedEarnings
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating earnings:', error);
      res.status(500).json({
        message: 'Failed to update earnings',
        error: error.errors ? error.errors.map(e => e.message) : error.message
      });
    }
  };

// Soft Delete Earnings Associated to the Company
exports.softDeleteEarnings = async (req, res) => {
    try {
        const { id } = req.params;
        const earnings = await Earnings.findByPk(id);

        if (!earnings) {
            return res.status(404).json({ message: 'Earnings not found' });
        }

        await earnings.destroy(); // Using paranoid delete (soft delete)

        res.status(200).json({ message: 'Earnings soft deleted successfully', deletedAt: earnings.deletedAt });
    } catch (error) {
        console.error('Error soft deleting earnings:', error);
        res.status(500).json({ message: 'Failed to soft delete earnings', error: error.message });
    }
};

// Assign Earnings to Employee
exports.assignToEmployee = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const {
        earningsId,
        employeeId,
        customMonthlyAmount,
        customPercentage,
        customNumberOfHours,
        customHourlyRate,
        customNumberOfWeeks,
        customWeeklyRate,
        customNumberOfDays,
        customDailyRate,
        effectiveDate,
        endDate,
      } = req.body;
  
      if (!earningsId || !employeeId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'earningsId and employeeId are required' });
      }
  
      const earnings = await Earnings.findOne({ 
        where: { id: earningsId, 
          status: 'active', 
          deletedAt: null }, 
          transaction });
      if (!earnings) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Earnings not found' });
      }
  
      const data = {
        employeeId,
        earningsId,
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
  
      const [employeeEarnings, created] = await EmployeeEarnings.upsert(data, {
        where: {
          employeeId,
          earningsId,
          [Op.or]: [
            { endDate: null }, 
            { endDate: { [Op.gte]: new Date() } 
          }],
        },
        transaction,
      });
  
      await transaction.commit();
      res.status(created ? 201 : 200).json({
        message: created ? 'Earnings assigned to employee' : 'Employee earnings updated',
        employeeEarnings,
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error assigning earnings to employee:', error);
      res.status(500).json({
        message: 'Failed to assign earnings to employee',
        error: error.errors ? error.errors.map(e => e.message) : error.message,
      });
    }
  };

// Update Employee Earnings
exports.updateEmployeeEarnings = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const {
        customMonthlyAmount,
        customPercentage,
        customNumberOfHours,
        customHourlyRate,
        customNumberOfWeeks,
        customWeeklyRate,
        customNumberOfDays,
        customDailyRate,
        status,
        effectiveDate,
        endDate,
      } = req.body;
  
      const employeeEarnings = await EmployeeEarnings.findByPk(id, {
        include: [{ 
          model: Earnings, as: 'earnings', 
          required: true 
        }],
        transaction,
      });
  
      if (!employeeEarnings) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Employee earnings not found' });
      }
  
      const updatedData = {
        customMonthlyAmount,
        customPercentage,
        customNumberOfHours,
        customHourlyRate,
        customNumberOfWeeks,
        customWeeklyRate,
        customNumberOfDays,
        customDailyRate,
        status,
        effectiveDate,
        endDate,
      };
  
      await EmployeeEarnings.update(updatedData, { 
        where: { id }, 
        transaction 
      });

      const updatedEmployeeEarnings = await EmployeeEarnings.findByPk(id, { transaction });
  
      await transaction.commit();
      res.status(200).json({
        message: 'Employee earnings updated successfully',
        employeeEarnings: updatedEmployeeEarnings,
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating employee earnings:', error);
      res.status(500).json({
        message: 'Failed to update employee earnings',
        error: error.errors ? error.errors.map(e => e.message) : error.message,
      });
    }
  };

// Update Specific Earnings of an Employee
exports.updateEmployeeSpecificEarning = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const employeeEarnings = await EmployeeEarnings.findByPk(id, {
      include: [{ 
        model: Earnings, as: 'earnings', 
        required: true 
      }],
      transaction,
    });

    if (!employeeEarnings) {
      await transaction.rollback();
      return res.status(404).json({ 
        message: 'Employee specific earning not found' 
      });
    }

    if (req.body.calculatedAmount !== undefined) {
      return res.status(400).json({ 
        message: 'Cannot directly update calculatedAmount. It is auto-calculated.' 
      });
    }

    const updatableFields = [
      'customMonthlyAmount',
      'customPercentage',
      'customNumberOfHours',
      'customHourlyRate',
      'customNumberOfWeeks',
      'customWeeklyRate',
      'customNumberOfDays',
      'customDailyRate',
      'status',
      'effectiveDate',
      'endDate'
    ];

    assignIfDefined(employeeEarnings, req.body, updatableFields);

    await employeeEarnings.save({ transaction });

    await transaction.commit();

    res.status(200).json({
      message: 'Employee specific earning updated successfully',
      employeeEarnings,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating employee specific earning:', error);
    res.status(500).json({
      message: 'Failed to update employee specific earning',
      error: error.errors ? error.errors.map(e => e.message) : error.message,
    });
  }
};

// Delete Specific Earnings of an Employee (Soft Delete)
exports.deleteEmployeeSpecificEarning = async (req, res) => {
    try {
        const { id } = req.params; // ID of the EmployeeEarnings record

        const employeeEarnings = await EmployeeEarnings.findByPk(id);

        if (!employeeEarnings) {
            return res.status(404).json({ message: 'Employee specific earning not found' });
        }

        await employeeEarnings.destroy(); // Using paranoid delete (soft delete)

        res.status(200).json({ message: 'Employee specific earning deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee specific earning:', error);
        res.status(500).json({ message: 'Failed to delete employee specific earning', error: error.message });
    }
};

// Filter Employees' Earnings by Type, Status, Calculation Method
exports.filterEmployeeEarnings = async (req, res) => {
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
        const earningsWhereClause = { deletedAt: null };

        if (type) {
            earningsWhereClause.earningsType = { [Op.iLike]: `%${type}%` };
        }
        if (status) {
            earningsWhereClause.status = status;
        }
        if (calculationMethod) {
            earningsWhereClause.calculationMethod = calculationMethod;
        }

        const earnings = await EmployeeEarnings.findAll({
            where: whereClause,
            include: [{
                model: Earnings,
                as: 'earnings',
                where: earningsWhereClause,
                attributes: ['id', 'earningsType', 'calculationMethod', 'isTaxable', 'status', 'mode']
            }],
            attributes: ['id', 'customMonthlyAmount', 'customPercentage', 'customHourlyRate', 'customWeeklyRate', 'customDailyRate','customNumberOfHours', 'customNumberOfDays', 'customNumberOfWeeks', 'effectiveDate', 'endDate', 'calculatedAmount']
        });

        res.status(200).json(earnings);
    } catch (error) {
        console.error('Error filtering employee earnings:', error);
        res.status(500).json({ message: 'Failed to filter employee earnings', error: error.message });
    }
};

// Get a List of All Employees with Their Associated Earnings
exports.getAllEmployeesWithEarnings = async (req, res) => {
    try {
        const employees = await Employee.findAll({
            include: [{
                model: EmployeeEarnings,
                as: 'employeeEarnings',
                where: {
                    status: 'active',
                    [Op.or]: [
                        { endDate: null },
                        { endDate: { [Op.gte]: new Date() } }
                    ]
                },
                include: [{
                    model: Earnings,
                    as: 'earnings',
                    attributes: ['id', 'earningsType', 'calculationMethod', 'isTaxable', 'status', 'mode']
                }],
                attributes: ['id', 'customMonthlyAmount', 
                  'customPercentage', 'customHourlyRate', 
                  'customWeeklyRate', 'customDailyRate',
                  'customNumberOfHours', 'customNumberOfDays', 
                  'customNumberOfWeeks', 'effectiveDate', 
                  'endDate', 'calculatedAmount'
                ]
            }],
            attributes: ['id', 'firstName', 'lastName', 'staffNo', 'basicSalary'] 
        });

        res.status(200).json(employees);
    } catch (error) {
        console.error('Error fetching employees with their earnings:', error);
        res.status(500).json({ message: 'Failed to fetch employees with their earnings', error: error.message });
    }
};

// Get All Earnings (Regardless of Company)
exports.getAllSystemEarnings = async (req, res) => {
    try {
        const earnings = await Earnings.findAll({
            where: { deletedAt: null },
            attributes: ['id', 'earningsType', 'calculationMethod', 
              'isTaxable', 'status', 'createdAt', 'updatedAt', 'companyId', 'mode'
            ]
        });

        res.status(200).json(earnings);
    } catch (error) {
        console.error('Error fetching all system earnings:', error);
        res.status(500).json({ message: 'Failed to fetch all system earnings', error: error.message });
    }
};

exports.getAllEmployeesWithEarningsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate and parse date inputs if provided
    const isValidDate = (date) => date instanceof Date && !isNaN(date);
    let employmentDateFilter = {};
    let earningsDateFilter = {};

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
      earningsDateFilter = {
        effectiveDate: {
          [Op.gte]: start,
          [Op.lte]: end,
        },
      };
    }

    // Build the query
    const employees = await Employee.findAll({
      where: {
        deletedAt: null,
        companyId,
        // Apply employmentDate filter only if dates are provided
        ...(Object.keys(employmentDateFilter).length > 0 && { employmentDate: employmentDateFilter }),
      },
      attributes: [
        "id",
        "firstName",
        "lastName",
        "staffNo",
        "basicSalary",
      ],
      include: [
        {
          model: EmployeeEarnings,
          as: 'employeeEarnings',
          attributes: [
            "id",
            "customMonthlyAmount",
            "customPercentage",
            "customNumberOfHours",
            "customNumberOfDays",
            "customNumberOfWeeks",
            "customHourlyRate",
            "customDailyRate",
            "customWeeklyRate",
            "calculatedAmount",
            "effectiveDate",
            "endDate",
          ],
          where: {
            // Apply effectiveDate filter if provided, otherwise only status and endDate conditions
            ...earningsDateFilter,
            [Op.or]: [
              { endDate: null },
              { endDate: { [Op.gte]: new Date() } },
            ],
            status: "active",
          },
          required: false, // LEFT JOIN to include employees even if they have no earnings
          include: [
            {
              model: Earnings,
              as: 'earnings',
              attributes: [
                "id",
                "earningsType",
                "calculationMethod",
                "isTaxable",
                "status",
                "mode",
              ],
              where: {
                deletedAt: null,
                companyId,
                isTaxable: true,
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
          ? "No employees found within the specified date range."
          : "No employees found for the company.",
        data: [],
      });
    }

    return res.status(200).json({
      message: "Employees with earnings fetched successfully.",
      data: employees,
    });
  } catch (error) {
    console.error("Error fetching employees with earnings:", error);
    return res.status(500).json({
      message: "Failed to fetch employees with earnings",
      error: error.message,
    });
  }
};

exports.permanentlyDeleteEarnings = async (req, res) => {
  const { id } = req.params;

  try {
    const earnings = await Earnings.findByPk(id, { paranoid: false });

    if (!earnings) {
      return res.status(404).json({ message: "Earnings not found" });
    }

    await earnings.destroy({ force: true });

    return res.status(200).json({
      message: "Earnings permanently deleted",
      deletedId: id,
    });
  } catch (error) {
    console.error("Error permanently deleting earnings:", error);
    return res.status(500).json({
      message: "Failed to permanently delete earnings",
      error: error.message,
    });
  }
};

// DELETE all earnings records permanently (global or by companyId)
exports.deleteAllEarnings = async (req, res) => {
  try {
    const { companyId } = req.query; // optional filter

    const whereClause = companyId ? { companyId } : {};

    const deletedCount = await Earnings.destroy({
      where: whereClause,
      force: true, // permanently delete (bypass paranoid)
    });

    return res.status(200).json({
      message: `Permanently deleted ${deletedCount} earnings record(s)`,
      companyId: companyId || 'ALL',
    });
  } catch (error) {
    console.error("Error deleting all earnings:", error);
    return res.status(500).json({
      message: "Failed to delete earnings records",
      error: error.message,
    });
  }
};





