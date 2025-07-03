// controllers/departmentController.js
const {Op} = require('sequelize');
const { Department, Company } = require('../models'); // Import both models
const softDelete = require('../utils/softDelete');

// Create Department for a specific company
exports.createDepartment = async (req, res) => {
  try {
    const { companyId, title, departmentCode, ...rest } = req.body;

    // Check if the company exists
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(400).json({ message: 'Company not found' });
    }

    // Check for duplicate title or departmentCode within the same company
    const existingDepartment = await Department.findOne({
      where: {
        companyId,
        [Op.or]: [{ title }, { departmentCode }],
        deletedAt: null
      }
    });

    if (existingDepartment) {
      return res.status(409).json({
        message: 'A department with the same title or code already exists in this company.'
      });
    }

    const newDepartment = await Department.create({ title, departmentCode, ...rest, companyId });
    res.status(201).json(newDepartment);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ message: 'Failed to create department', error: error?.errors || error.message });
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
    const { companyId, title, departmentCode, ...rest } = req.body;
    const departmentId = req.params.id;

    // Check if the department exists
    const existingDepartment = await Department.findByPk(departmentId);
    if (!existingDepartment || existingDepartment.deletedAt) {
      return res.status(404).json({ message: 'Department not found or already deleted' });
    }

    const effectiveCompanyId = companyId || existingDepartment.companyId;

    // If companyId is changing, validate the new company exists
    if (companyId && companyId !== existingDepartment.companyId) {
      const company = await Company.findByPk(companyId);
      if (!company) {
        return res.status(400).json({ message: 'Company not found' });
      }
    }

    // Check for title or departmentCode conflicts in the same company (excluding this record)
    if (title || departmentCode) {
      const conflict = await Department.findOne({
        where: {
          companyId: effectiveCompanyId,
          id: { [Op.ne]: departmentId },
          deletedAt: null,
          [Op.or]: [
            title ? { title } : null,
            departmentCode ? { departmentCode } : null
          ].filter(Boolean)
        }
      });

      if (conflict) {
        return res.status(409).json({
          message: 'Another department with the same title or code exists in this company.'
        });
      }
    }

    await Department.update(
      { title, departmentCode, ...rest, companyId: effectiveCompanyId },
      { where: { id: departmentId } }
    );

    const updatedDepartment = await Department.findByPk(departmentId, {
      include: [{ model: Company, as: 'company' }]
    });

    res.status(200).json(updatedDepartment);
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ message: 'Failed to update department', error: error?.errors || error.message });
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








