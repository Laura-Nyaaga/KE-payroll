const { Op } = require('sequelize');
const { JobTitle, Company } = require('../models'); 
const softDelete = require('../utils/softDelete');

// Create JobTitle for a specific company
exports.createJobTitle = async (req, res) => {
  try {
    const { companyId, name, ...rest } = req.body;

    console.log('Job Title Data:', { name, ...rest });

    // Check if the company exists
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(400).json({ message: 'Company not found' });
    }

    // Check for duplicate job title name within the same company
    const existingJobTitle = await JobTitle.findOne({
      where: {
        companyId,
        name,
        deletedAt: null
      }
    });

    if (existingJobTitle) {
      return res.status(409).json({
        message: 'A job title with this name already exists in this company.'
      });
    }

    const newJobTitle = await JobTitle.create({ ...rest, name, companyId });
    res.status(201).json(newJobTitle);
  } catch (error) {
    console.error('Error creating job title:', error);
    res.status(500).json({ message: 'Failed to create job title', error: error?.errors || error.message });
  }
};


// Get all JobTitles (potentially filterable by company - adjust as needed)
exports.getAllJobTitles = async (req, res) => {
    try {
        const whereClause = { deletedAt: null };
        if (req.query.companyId) {
            whereClause.companyId = req.query.companyId;
        }
        const jobTitles = await JobTitle.findAll({
            where: whereClause,
            include: [{ model: Company, as: 'company' }], // Include company details
        });
        res.status(200).json(jobTitles);
    } catch (error) {
        console.error('Error fetching job titles:', error);
        res.status(500).json({ message: 'Failed to fetch job titles' });
    }
};

// Get JobTitle by ID
exports.getJobTitleById = async (req, res) => {
    try {
        const jobTitle = await JobTitle.findByPk(req.params.id, {
            where: { deletedAt: null },
            include: [{ model: Company, as: 'company' }], // Include company details
        });
        if (!jobTitle) {
            return res.status(404).json({ message: 'Job title not found' });
        }
        res.status(200).json(jobTitle);
    } catch (error) {
        console.error('Error fetching job title by ID:', error);
        res.status(500).json({ message: 'Failed to fetch job title' });
    }
};

// Update JobTitle
exports.updateJobTitle = async (req, res) => {
  try {
    const { companyId, name, ...rest } = req.body;
    const jobTitleId = req.params.id;

    // Fetch the existing job title
    const existingJobTitle = await JobTitle.findByPk(jobTitleId);
    if (!existingJobTitle || existingJobTitle.deletedAt) {
      return res.status(404).json({ message: 'Job title not found or already deleted' });
    }

    const effectiveCompanyId = companyId || existingJobTitle.companyId;

    // Validate company existence if companyId is changing
    if (companyId && companyId !== existingJobTitle.companyId) {
      const company = await Company.findByPk(companyId);
      if (!company) {
        return res.status(400).json({ message: 'Company not found' });
      }
    }

    // Check for name conflict (excluding the current record)
    if (name) {
      const conflict = await JobTitle.findOne({
        where: {
          companyId: effectiveCompanyId,
          name,
          id: { [Op.ne]: jobTitleId },
          deletedAt: null
        }
      });

      if (conflict) {
        return res.status(409).json({
          message: 'Another job title with this name already exists in this company.'
        });
      }
    }

    await JobTitle.update(
      { ...rest, name, companyId: effectiveCompanyId },
      { where: { id: jobTitleId } }
    );

    const updatedJobTitle = await JobTitle.findByPk(jobTitleId, {
      include: [{ model: Company, as: 'company' }]
    });

    res.status(200).json(updatedJobTitle);
  } catch (error) {
    console.error('Error updating job title:', error);
    res.status(500).json({ message: 'Failed to update job title', error: error?.errors || error.message });
  }
};


// Soft Delete JobTitle
exports.softDeleteJobTitle = async (req, res) => {
    await softDelete(JobTitle, req.params.id, res);
};

// Get all JobTitles for a specific company
exports.getJobTitlesByCompany = async (req, res) => {
    const { companyId } = req.params;
    try {
        const company = await Company.findByPk(companyId);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const jobTitles = await JobTitle.findAll({
            where: { companyId: companyId, deletedAt: null },
            include: [{ model: Company, as: 'company' }],
        });
        res.status(200).json(jobTitles);
    } catch (error) {
        console.error('Error fetching job titles by company:', error);
        res.status(500).json({ message: 'Failed to fetch job titles for this company' });
    }
};







