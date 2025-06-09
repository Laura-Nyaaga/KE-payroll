// controllers/departmentController.js
const { Department, Company } = require('../models'); // Import both models
const softDelete = require('../utils/softDelete');

// Create Department for a specific company
exports.createDepartment = async (req, res) => {
    try {
        const { companyId, ...departmentData } = req.body;

        // Check if the company exists
        const company = await Company.findByPk(companyId);
        if (!company) {
            return res.status(400).json({ message: 'Company not found' });
        }

        const newDepartment = await Department.create({ ...departmentData, companyId });
        res.status(201).json(newDepartment);
    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({ message: 'Failed to create department', error: error.errors });
    }
};

// Get all Departments (potentially filterable by company - adjust as needed)
exports.getAllDepartments = async (req, res) => {
    try {
        const whereClause = { deletedAt: null };
        if (req.query.companyId) {
            whereClause.companyId = req.query.companyId;
        }
        const departments = await Department.findAll({
            where: whereClause,
            include: [{ model: Company, as: 'company' }], // Include company details
        });
        res.status(200).json(departments);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ message: 'Failed to fetch departments' });
    }
};

// Get Department by ID
exports.getDepartmentById = async (req, res) => {
    try {
        const department = await Department.findByPk(req.params.id, {
            where: { deletedAt: null },
            include: [{ model: Company, as: 'company' }], // Include company details
        });
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        res.status(200).json(department);
    } catch (error) {
        console.error('Error fetching department by ID:', error);
        res.status(500).json({ message: 'Failed to fetch department' });
    }
};

// Update Department
exports.updateDepartment = async (req, res) => {
    try {
        const { companyId, ...departmentData } = req.body;
        const departmentId = req.params.id;

        // Check if the department exists and is not deleted
        const existingDepartment = await Department.findByPk(departmentId, { where: { deletedAt: null } });
        if (!existingDepartment) {
            return res.status(404).json({ message: 'Department not found or already deleted' });
        }

        // If companyId is provided, check if the company exists
        if (companyId) {
            const company = await Company.findByPk(companyId);
            if (!company) {
                return res.status(400).json({ message: 'Company not found' });
            }
            await Department.update({ ...departmentData, companyId }, {
                where: { id: departmentId, deletedAt: null },
            });
        } else {
            await Department.update(departmentData, {
                where: { id: departmentId, deletedAt: null },
            });
        }

        const updatedDepartment = await Department.findByPk(departmentId, { include: [{ model: Company, as: 'company' }] });
        res.status(200).json(updatedDepartment);
    } catch (error) {
        console.error('Error updating department:', error);
        res.status(500).json({ message: 'Failed to update department', error: error.errors });
    }
};

// Soft Delete Department
exports.softDeleteDepartment = async (req, res) => {
    await softDelete(Department, req.params.id, res);
};

// Get all Departments for a specific company
exports.getDepartmentsByCompany = async (req, res) => {
    const { companyId } = req.params;
    try {
        const company = await Company.findByPk(companyId);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const departments = await Department.findAll({
            where: { companyId: companyId, deletedAt: null },
            include: [{ model: Company, as: 'company' }],
        });
        res.status(200).json(departments);
    } catch (error) {// ... keep other form fields and styles unchanged ...
        console.error('Error fetching departments by company:', error);
        res.status(500).json({ message: 'Failed to fetch departments for this company' });
    }
};








