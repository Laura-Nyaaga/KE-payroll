const { JobTitle, Company } = require('../models'); 
const softDelete = require('../utils/softDelete');

// Create JobTitle for a specific company
exports.createJobTitle = async (req, res) => {
    try {
        const { companyId, ...jobTitleData } = req.body;

        console.log('Job Title Data:', jobTitleData);

        // Check if the company exists
        const company = await Company.findByPk(companyId);
        if (!company) {
            return res.status(400).json({ message: 'Company not found' });
        }

        const newJobTitle = await JobTitle.create({ ...jobTitleData, companyId });
        res.status(201).json(newJobTitle);
    } catch (error) {
        console.error('Error creating job title:', error);
        res.status(500).json({ message: 'Failed to create job title', error: error.errors });
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
        const { companyId, ...jobTitleData } = req.body;
        const jobTitleId = req.params.id;

        // Check if the job title exists and is not deleted
        const existingJobTitle = await JobTitle.findByPk(jobTitleId, { where: { deletedAt: null } });
        if (!existingJobTitle) {
            return res.status(404).json({ message: 'Job title not found or already deleted' });
        }

        // If companyId is provided, check if the company exists
        if (companyId) {
            const company = await Company.findByPk(companyId);
            if (!company) {
                return res.status(400).json({ message: 'Company not found' });
            }
            await JobTitle.update({ ...jobTitleData, companyId }, {
                where: { id: jobTitleId, deletedAt: null },
            });
        } else {
            await JobTitle.update(jobTitleData, {
                where: { id: jobTitleId, deletedAt: null },
            });
        }

        const updatedJobTitle = await JobTitle.findByPk(jobTitleId, { include: [{ model: Company, as: 'company' }] });
        res.status(200).json(updatedJobTitle);
    } catch (error) {
        console.error('Error updating job title:', error);
        res.status(500).json({ message: 'Failed to update job title', error: error.errors });
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







