const { AdvancePay, Employee, Department } = require('../models');
const { Op } = require('sequelize');
const softDelete = require('../utils/softDelete');

// Create AdvancePay with validation
exports.createAdvancePay = async (req, res) => {
    try {
        const { employeeId, advanceAmount, noOfInstallments } = req.body;

        // Validate required fields
        if (!employeeId || !advanceAmount || !noOfInstallments) {
            return res.status(400).json({
                message: 'Missing required fields: employeeId, advanceAmount, noOfInstallments'
            });
        }

        // Check if employee exists
        const employee = await Employee.findByPk(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const newAdvancePay = await AdvancePay.create({
            ...req.body,
            processedBy: req.user.id
        });

        res.status(201).json({
            message: 'Advance pay created successfully',
            advancePay: newAdvancePay
        });
    } catch (error) {
        console.error('Error creating advance pay:', error);
        res.status(500).json({
            message: 'Failed to create advance pay',
            error: error.errors ? error.errors.map(e => e.message) : error.message
        });
    }
};

// Get all AdvancePays with advanced filtering
exports.getAllAdvancePays = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            employeeId,
            departmentId,
            status,
            startDate,
            endDate,
            employmentType,
            sortBy = 'transactionDate',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        const where = { deletedAt: null };

        // Apply filters
        if (employeeId) where.employeeId = employeeId;
        if (status) where.status = status;
        if (startDate && endDate) {
            where.transactionDate = { [Op.between]: [startDate, endDate] };
        } else if (startDate) {
            where.transactionDate = { [Op.gte]: startDate };
        } else if (endDate) {
            where.transactionDate = { [Op.lte]: endDate };
        }

        // Department filter through employee association
        const employeeWhere = {};
        if (departmentId) employeeWhere.departmentId = departmentId;
        if (employmentType) employeeWhere.employeeType = employmentType;

        const { count, rows } = await AdvancePay.findAndCountAll({
            where,
            include: [
                {
                    model: Employee,
                    where: employeeWhere,
                    attributes: ['id', 'firstName', 'lastName', 'staffNo', 'employeeType'],
                    include: [
                        {
                            model: Department,
                            attributes: ['id', 'name']
                        }
                    ]
                }
            ],
            order: [[sortBy, sortOrder]],
            limit: parseInt(limit),
            offset: parseInt(offset),
            distinct: true
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            itemsPerPage: parseInt(limit),
            advancePays: rows
        });
    } catch (error) {
        console.error('Error fetching advance pays:', error);
        res.status(500).json({
            message: 'Failed to fetch advance pays',
            error: error.message
        });
    }
};

// Get AdvancePay by ID with employee details
exports.getAdvancePayById = async (req, res) => {
    try {
        const advancePay = await AdvancePay.findByPk(req.params.id, {
            where: { deletedAt: null },
            include: [
                {
                    model: Employee,
                    attributes: ['id', 'firstName', 'lastName', 'staffNo', 'employeeType'],
                    include: [
                        {
                            model: Department,
                            attributes: ['id', 'name']
                        }
                    ]
                }
            ]
        });

        if (!advancePay) {
            return res.status(404).json({ message: 'Advance pay not found' });
        }

        res.status(200).json(advancePay);
    } catch (error) {
        console.error('Error fetching advance pay by ID:', error);
        res.status(500).json({
            message: 'Failed to fetch advance pay',
            error: error.message
        });
    }
};

// Update AdvancePay with validation
exports.updateAdvancePay = async (req, res) => {
    try {
        const { id } = req.params;
        const { amountPaid, status, ...otherFields } = req.body;

        // Prevent updating referenceNumber
        if (otherFields.referenceNumber) {
            return res.status(400).json({ message: 'Cannot update reference number.' });
        }

        const advancePay = await AdvancePay.findByPk(id);
        if (!advancePay || advancePay.deletedAt !== null) {
            return res.status(404).json({ message: 'Advance pay not found or already deleted' });
        }

        // Only allow specific field updates
        const updateData = {};
        if (amountPaid !== undefined) updateData.amountPaid = amountPaid;
        if (status) updateData.status = status;

        const [updated] = await AdvancePay.update(updateData, {
            where: { id, deletedAt: null }
        });

        if (!updated) {
            return res.status(404).json({ message: 'Advance pay not found or already deleted' });
        }

        const updatedAdvancePay = await AdvancePay.findByPk(id, {
            include: [
                {
                    model: Employee,
                    attributes: ['id', 'firstName', 'lastName']
                }
            ]
        });

        res.status(200).json({
            message: 'Advance pay updated successfully',
            advancePay: updatedAdvancePay
        });
    } catch (error) {
        console.error('Error updating advance pay:', error);
        res.status(500).json({
            message: 'Failed to update advance pay',
            error: error.message
        });
    }
};

// Soft Delete AdvancePay with validation
exports.softDeleteAdvancePay = async (req, res) => {
    try {
        const advancePay = await AdvancePay.findByPk(req.params.id);

        if (!advancePay) {
            return res.status(404).json({ message: 'Advance pay not found' });
        }

        if (advancePay.status === 'Paid') {
            return res.status(400).json({
                message: 'Cannot delete paid advance',
                error: 'Paid advances cannot be deleted'
            });
        }

        advancePay.deletedAt = new Date();
        await advancePay.save();

        res.status(200).json({
            message: 'Advance pay deleted successfully',
            deletedAt: advancePay.deletedAt
        });
    } catch (error) {
        console.error('Error soft deleting advance pay:', error);
        res.status(500).json({
            message: 'Failed to delete advance pay',
            error: error.message
        });
    }
};

// Record advance payment installment
exports.recordPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, paymentDate, referenceNumber } = req.body;

        if (!amount || !paymentDate || !referenceNumber) {
            return res.status(400).json({
                message: 'Missing required fields: amount, paymentDate, referenceNumber'
            });
        }

        const advancePay = await AdvancePay.findByPk(id);
        if (!advancePay || advancePay.deletedAt !== null) {
            return res.status(404).json({ message: 'Advance pay not found or already deleted' });
        }

        // Calculate new amount paid
        const newAmountPaid = parseFloat(advancePay.amountPaid) + parseFloat(amount);

        // Update advance pay
        const [updated] = await AdvancePay.update({
            amountPaid: newAmountPaid,
            // Keep the original reference number, the one in the request is for payment reference
            paymentDate
        }, {
            where: { id, deletedAt: null }
        });

        if (!updated) {
            return res.status(404).json({ message: 'Advance pay not found or already deleted' });
        }

        const updatedAdvancePay = await AdvancePay.findByPk(id);

        res.status(200).json({
            message: 'Payment recorded successfully',
            advancePay: updatedAdvancePay
        });
    } catch (error) {
        console.error('Error recording payment:', error);
        res.status(500).json({
            message: 'Failed to record payment',
            error: error.message
        });
    }
};

// Get all employees with advance payments
exports.getEmployeesWithAdvancePayments = async (req, res) => {
    try {
        const employees = await Employee.findAll({
            include: [{
                model: AdvancePay,
                where: { deletedAt: null },
                required: true // Only include employees who have at least one advance pay record
            }],
            attributes: ['id', 'firstName', 'lastName', 'staffNo'] // Include relevant employee attributes
        });

        res.status(200).json(employees);
    } catch (error) {
        console.error('Error fetching employees with advance payments:', error);
        res.status(500).json({
            message: 'Failed to fetch employees with advance payments',
            error: error.message
        });
    }
};

// Get all employees with advance payment based on their status
exports.getEmployeesWithAdvancePaymentsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        if (!['Partially Paid', 'Paid', 'Not Paid'].includes(status)) {
            return res.status(400).json({ message: 'Invalid advance payment status' });
        }

        const employees = await Employee.findAll({
            include: [{
                model: AdvancePay,
                where: { status: status, deletedAt: null },
                required: true
            }],
            attributes: ['id', 'firstName', 'lastName', 'staffNo']
        });

        res.status(200).json(employees);
    } catch (error) {
        console.error(`Error fetching employees with advance payments by status (${status}):`, error);
        res.status(500).json({
            message: 'Failed to fetch employees with advance payments by status',
            error: error.message
        });
    }
};

// Get all employees with balances
exports.getEmployeesWithBalances = async (req, res) => {
    try {
        const employees = await Employee.findAll({
            include: [{
                model: AdvancePay,
                where: { balance: { [Op.gt]: 0 }, deletedAt: null },
                required: true
            }],
            attributes: ['id', 'firstName', 'lastName', 'staffNo']
        });

        res.status(200).json(employees);
    } catch (error) {
        console.error('Error fetching employees with balances:', error);
        res.status(500).json({
            message: 'Failed to fetch employees with balances',
            error: error.message
        });
    }
};

// Get all employees with advance payments in a specific company
exports.getEmployeesWithAdvancePaymentsByCompany = async (req, res) => {
    try {
        const { companyId } = req.params; // Assuming Employee model has a companyId field

        const employees = await Employee.findAll({
            where: { companyId: companyId },
            include: [{
                model: AdvancePay,
                where: { deletedAt: null },
                required: true
            }],
            attributes: ['id', 'firstName', 'lastName', 'staffNo']
        });

        res.status(200).json(employees);
    } catch (error) {
        console.error(`Error fetching employees with advance payments in company ${companyId}:`, error);
        res.status(500).json({
            message: 'Failed to fetch employees with advance payments in this company',
            error: error.message
        });
    }
};








