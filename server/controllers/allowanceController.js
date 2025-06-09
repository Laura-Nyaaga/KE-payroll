const { Allowance, EmployeeAllowance, Employee, sequelize } = require('../models');
const { Op } = require('sequelize');
// const sequelize = require('../config/db'); 

// Create Company-Level Allowance
exports.createAllowance = async (req, res) => {
    try {
        const { companyId, allowanceType, calculationMethod, amount, percentage, isTaxable, status, startDate, endDate } = req.body;

        if (!companyId || !allowanceType || !calculationMethod) {
            return res.status(400).json({ message: 'companyId, allowanceType, and calculationMethod are required' });
        }

        if (calculationMethod === 'fixed_amount' && (amount === null || amount === undefined)) {
            return res.status(400).json({ message: 'amount is required for fixed_amount calculation method' });
        }
        if (calculationMethod === 'percentage' && (percentage === null || percentage === undefined)) {
            return res.status(400).json({ message: 'percentage is required for percentage calculation method' });
        }

        const newAllowance = await Allowance.create({
            companyId,
            allowanceType,
            calculationMethod,
            amount,
            percentage,
            isTaxable: isTaxable !== false,
            status: status || 'active',
            startDate: startDate || new Date(),
            endDate
        });

        res.status(201).json({
            message: 'Allowance created successfully',
            allowance: {
                id: newAllowance.id,
                allowanceType: newAllowance.allowanceType,
                calculationMethod: newAllowance.calculationMethod,
                isTaxable: newAllowance.isTaxable,
                status: newAllowance.status,
                createdAt: newAllowance.createdAt,
                updatedAt: newAllowance.updatedAt
            }
        });
    } catch (error) {
        console.error('Error creating allowance:', error);
        res.status(500).json({
            message: 'Failed to create allowance',
            error: error.errors ? error.errors.map(e => e.message) : error.message
        });
    }
};

// Get All Company Allowances (Allowances) for a Specific Company
exports.getAllCompanyAllowances = async (req, res) => {
    try {
        const { companyId } = req.params; // Get companyId from path parameter

        if (!companyId) {
            return res.status(400).json({ message: 'companyId path parameter is required' });
        }

        const allowances = await Allowance.findAll({
            where: {
                companyId,
                deletedAt: null
            },
            attributes: ['id', 'allowanceType', 'calculationMethod', 'isTaxable', 'status', 'createdAt', 'updatedAt']
        });

        res.status(200).json(allowances);
    } catch (error) {
        console.error('Error fetching company allowances:', error);
        res.status(500).json({ message: 'Failed to fetch company allowances', error: error.message });
    }
};

// Get All Allowances for a Particular Employee
exports.getEmployeeAllowances = async (req, res) => {
    try {
        const { employeeId } = req.params;

        const allowances = await EmployeeAllowance.findAll({
            where: {
                employeeId,
                status: 'active',
                [Op.or]: [
                    { endDate: null },
                    { endDate: { [Op.gte]: new Date() } }
                ]
            },
            include: [{
                model: Allowance,
                as: 'allowance',
                attributes: ['id', 'allowanceType', 'calculationMethod', 'isTaxable', 'status']
            }],
            attributes: ['id', 'customAmount', 'customPercentage', 'calculatedAmount', 'effectiveDate', 'endDate']
        });

        res.status(200).json(allowances);
    } catch (error) {
        console.error('Error fetching employee allowances:', error);
        res.status(500).json({
            message: 'Failed to fetch employee allowances',
            error: error.message
        });
    }
};

// Get Allowance Details by ID
exports.getAllowanceById = async (req, res) => {
    try {
        const allowance = await Allowance.findOne({
            where: {
                id: req.params.id,
                deletedAt: null
            },
            include: [{
                model: EmployeeAllowance,
                as: 'employeeAllowances',
                where: { status: 'active' },
                required: false
            }]
        });

        if (!allowance) {
            return res.status(404).json({ message: 'Allowance not found' });
        }

        res.status(200).json(allowance);
    } catch (error) {
        console.error('Error fetching allowance by ID:', error);
        res.status(500).json({ message: 'Failed to fetch allowance', error: error.message });
    }
};

// Update Allowances Associated to the Company
exports.updateAllowance = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { calculationMethod, amount, percentage, isTaxable, status, startDate, endDate } = req.body;

        if (calculationMethod === 'fixed_amount' && (amount === null || amount === undefined)) {
            await transaction.rollback();
            return res.status(400).json({ message: 'amount is required for fixed_amount calculation method' });
        }
        if (calculationMethod === 'percentage' && (percentage === null || percentage === undefined)) {
            await transaction.rollback();
            return res.status(400).json({ message: 'percentage is required for percentage calculation method' });
        }

        const [updatedRows] = await Allowance.update({
            calculationMethod,
            amount,
            percentage,
            isTaxable,
            status,
            startDate,
            endDate
        }, {
            where: {
                id,
                deletedAt: null
            },
            transaction
        });

        if (updatedRows === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Allowance not found or already deleted' });
        }

        const updatedAllowance = await Allowance.findByPk(id, { transaction });
        await transaction.commit();

        res.status(200).json({
            message: 'Allowance updated successfully',
            allowance: updatedAllowance
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating allowance:', error);
        res.status(500).json({
            message: 'Failed to update allowance',
            error: error.errors ? error.errors.map(e => e.message) : error.message
        });
    }
};

// Soft Delete Allowances Associated to the Company
exports.softDeleteAllowance = async (req, res) => {
    try {
        const { id } = req.params;
        const allowance = await Allowance.findByPk(id);

        if (!allowance) {
            return res.status(404).json({ message: 'Allowance not found' });
        }

        await allowance.destroy(); // Using paranoid delete (soft delete)

        res.status(200).json({ message: 'Allowance soft deleted successfully', deletedAt: allowance.deletedAt });
    } catch (error) {
        console.error('Error soft deleting allowance:', error);
        res.status(500).json({ message: 'Failed to soft delete allowance', error: error.message });
    }
};

// Assign Allowance to Employee
exports.assignToEmployee = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { allowanceId, employeeId, customAmount, customPercentage, effectiveDate, endDate } = req.body;

        if (!allowanceId || !employeeId) {
            await transaction.rollback();
            return res.status(400).json({ message: 'allowanceId and employeeId are required' });
        }

        const allowance = await Allowance.findOne({
            where: {
                id: allowanceId,
                deletedAt: null
            },
            transaction
        });

        if (!allowance) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Allowance not found' });
        }

        if (allowance.calculationMethod === 'fixed_amount' && customAmount === undefined) {
            await transaction.rollback();
            return res.status(400).json({ message: 'customAmount is required for fixed_amount allowances' });
        }
        if (allowance.calculationMethod === 'percentage' && customPercentage === undefined) {
            await transaction.rollback();
            return res.status(400).json({ message: 'customPercentage is required for percentage allowances' });
        }

        const [employeeAllowance, created] = await EmployeeAllowance.upsert({
            employeeId,
            allowanceId,
            customAmount,
            customPercentage,
            effectiveDate: effectiveDate || new Date(),
            endDate,
            status: 'active'
        }, {
            where: {
                employeeId,
                allowanceId,
                [Op.or]: [
                    { endDate: null },
                    { endDate: { [Op.gte]: new Date() } }
                ]
            },
            transaction
        });

        await transaction.commit();

        res.status(created ? 201 : 200).json({
            message: created ? 'Allowance assigned to employee' : 'Employee allowance updated',
            employeeAllowance
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error assigning allowance to employee:', error);
        res.status(500).json({
            message: 'Failed to assign allowance to employee',
            error: error.errors ? error.errors.map(e => e.message) : error.message
        });
    }
};

// Update Employee Allowance
exports.updateEmployeeAllowance = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { customAmount, customPercentage, status, effectiveDate, endDate } = req.body;

        const employeeAllowance = await EmployeeAllowance.findOne({
            where: { id },
            include: [{
                model: Allowance,
                as: 'allowance',
                required: true
            }],
            transaction
        });

        if (!employeeAllowance) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Employee allowance not found' });
        }

        if (employeeAllowance.allowance.calculationMethod === 'fixed_amount' && customAmount === undefined) {
            await transaction.rollback();
            return res.status(400).json({ message: 'customAmount is required for fixed_amount allowances' });
        }
        if (employeeAllowance.allowance.calculationMethod === 'percentage' && customPercentage === undefined) {
            await transaction.rollback();
            return res.status(400).json({ message: 'customPercentage is required for percentage allowances' });
        }

        const updatedData = {
            customAmount,
            customPercentage,
            status,
            effectiveDate,
            endDate
        };

        await EmployeeAllowance.update(updatedData, {
            where: { id },
            transaction
        });

        await transaction.commit();

        res.status(200).json({
            message: 'Employee allowance updated successfully',
            employeeAllowance: {
                ...employeeAllowance.toJSON(),
                ...updatedData
            }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating employee allowance:', error);
        res.status(500).json({
            message: 'Failed to update employee allowance',
            error: error.errors ? error.errors.map(e => e.message) : error.message
        });
    }
};

// Filter Employees' Allowances by Type, Status, IsTaxable, Calculation Method
exports.filterEmployeeAllowances = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { type, status, isTaxable, calculationMethod } = req.query;
        const whereClause = {
            employeeId,
            status: 'active',
            [Op.or]: [
                { endDate: null },
                { endDate: { [Op.gte]: new Date() } }
            ]
        };
        const allowanceWhereClause = { deletedAt: null };

        if (type) {
            allowanceWhereClause.allowanceType = { [Op.iLike]: `%${type}%` };
        }
        if (status) {
            allowanceWhereClause.status = status;
        }
        if (isTaxable !== undefined) {
            allowanceWhereClause.isTaxable = isTaxable === 'true';
        }
        if (calculationMethod) {
            allowanceWhereClause.calculationMethod = calculationMethod;
        }

        const allowances = await EmployeeAllowance.findAll({
            where: whereClause,
            include: [{
                model: Allowance,
                as: 'allowance',
                where: allowanceWhereClause,
                attributes: ['id', 'allowanceType', 'calculationMethod', 'isTaxable', 'status']
            }],
            attributes: ['id', 'customAmount', 'customPercentage', 'effectiveDate', 'endDate']
        });

        res.status(200).json(allowances);
    } catch (error) {
        console.error('Error filtering employee allowances:', error);
        res.status(500).json({ message: 'Failed to filter employee allowances', error: error.message });
    }
};

// Get a List of All Employees with Their Associated Allowances
exports.getAllEmployeesWithAllowances = async (req, res) => {
    try {
        const employees = await Employee.findAll({
            include: [{
                model: EmployeeAllowance,
                as: 'employeeAllowances',
                where: {
                    status: 'active',
                    [Op.or]: [
                        { endDate: null },
                        { endDate: { [Op.gte]: new Date() } }
                    ]
                },
                include: [{
                    model: Allowance,
                    as: 'allowance',
                    attributes: ['id', 'allowanceType', 'calculationMethod', 'isTaxable', 'status']
                }],
                attributes: ['id', 'customAmount', 'customPercentage', 'effectiveDate', 'endDate','calculatedAmount']
            }],
            attributes: ['id', 'firstName', 'lastName', 'staffNo'] // Include relevant employee attributes
        });

        res.status(200).json(employees);
    } catch (error) {
        console.error('Error fetching employees with their allowances:', error);
        res.status(500).json({ message: 'Failed to fetch employees with their allowances', error: error.message });
    }
};

exports.updateEmployeeSpecificAllowance = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params; // ID of the EmployeeAllowance record
        const { customAmount, customPercentage, status, effectiveDate, endDate } = req.body;

        const employeeAllowance = await EmployeeAllowance.findByPk(id, {
            include: [{
                model: Allowance,
                as: 'allowance',
                required: true
            }],
            transaction
        });

        if (!employeeAllowance) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Employee specific allowance not found' });
        }

        if (employeeAllowance.allowance.calculationMethod === 'fixed_amount' && customAmount === undefined && customPercentage === undefined) {
            await transaction.rollback();
            return res.status(400).json({ message: 'customAmount is required for fixed_amount allowances' });
        }
        if (employeeAllowance.allowance.calculationMethod === 'percentage' && customPercentage === undefined && customAmount === undefined) {
            await transaction.rollback();
            return res.status(400).json({ message: 'customPercentage is required for percentage allowances' });
        }

        const updatedData = {};
        if (customAmount !== undefined) updatedData.customAmount = customAmount;
        if (customPercentage !== undefined) updatedData.customPercentage = customPercentage;
        if (status) updatedData.status = status;
        if (effectiveDate) updatedData.effectiveDate = effectiveDate;
        if (endDate !== undefined) updatedData.endDate = endDate;
         // Prevent direct update of calculatedAmount
        if (req.body.calculatedAmount !== undefined) {
            return res.status(400).json({ message: 'Cannot directly update calculatedAmount. It is auto-calculated.' });
        }

        await EmployeeAllowance.update(updatedData, {
            where: { id },
            transaction
        });

        const updatedEmployeeAllowance = await EmployeeAllowance.findByPk(id, { transaction });

        await transaction.commit();

        res.status(200).json({
            message: 'Employee specific allowance updated successfully',
            employeeAllowance: updatedEmployeeAllowance
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating employee specific allowance:', error);
        res.status(500).json({
            message: 'Failed to update employee specific allowance',
            error: error.errors ? error.errors.map(e => e.message) : error.message
        });
    }
};

// Delete Specific Allowance of an Employee (Soft Delete)
exports.deleteEmployeeSpecificAllowance = async (req, res) => {
    try {
        const { id } = req.params; // ID of the EmployeeAllowance record

        const employeeAllowance = await EmployeeAllowance.findByPk(id);

        if (!employeeAllowance) {
            return res.status(404).json({ message: 'Employee specific allowance not found' });
        }

        await employeeAllowance.destroy(); // Using paranoid delete (soft delete)

        res.status(200).json({ message: 'Employee specific allowance deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee specific allowance:', error);
        res.status(500).json({ message: 'Failed to delete employee specific allowance', error: error.message });
    }
};

exports.getAllSystemAllowances = async (req, res) => {
    try {
        const allowances = await Allowance.findAll({
            where: { deletedAt: null },
            attributes: ['id', 'allowanceType', 'calculationMethod', 'isTaxable', 'status', 'createdAt', 'updatedAt', 'companyId']
        });

        res.status(200).json(allowances);
    } catch (error) {
        console.error('Error fetching all system allowances:', error);
        res.status(500).json({ message: 'Failed to fetch all system allowances', error: error.message });
    }
};









