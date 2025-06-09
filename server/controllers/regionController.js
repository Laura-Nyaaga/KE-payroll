// controllers/regionController.js
const { Region, Company } = require('../models');
const softDelete = require('../utils/softDelete');

// Create Region for a specific company
exports.createRegion = async (req, res) => {
    try {
        const { companyId, ...regionData } = req.body;

        // Check if the company exists
        const company = await Company.findByPk(companyId);
        if (!company) {
            return res.status(400).json({ message: 'Company not found' });
        }

        const newRegion = await Region.create({ ...regionData, companyId });
        res.status(201).json(newRegion);
    } catch (error) {
        console.error('Error creating region:', error);
        res.status(500).json({ message: 'Failed to create region', error: error.errors });
    }
};

// Get all Regions (potentially filterable by company)
exports.getAllRegions = async (req, res) => {
    try {
        const whereClause = { deletedAt: null };
        if (req.query.companyId) {
            whereClause.companyId = req.query.companyId;
        }
        const regions = await Region.findAll({
            where: whereClause,
            include: [{ model: Company, as: 'company' }], // Include company details
        });
        res.status(200).json(regions);
    } catch (error) {
        console.error('Error fetching regions:', error);
        res.status(500).json({ message: 'Failed to fetch regions' });
    }
};

// Get Region by ID
exports.getRegionById = async (req, res) => {
    try {
        const region = await Region.findByPk(req.params.id, {
            where: { deletedAt: null },
            include: [{ model: Company, as: 'company' }], // Include company details
        });
        if (!region) {
            return res.status(404).json({ message: 'Region not found' });
        }
        res.status(200).json(region);
    } catch (error) {
        console.error('Error fetching region by ID:', error);
        res.status(500).json({ message: 'Failed to fetch region' });
    }
};

// Update Region
exports.updateRegion = async (req, res) => {
    try {
        const { companyId, ...regionData } = req.body;
        const regionId = req.params.id;

        // Check if the region exists and is not deleted
        const existingRegion = await Region.findByPk(regionId, { where: { deletedAt: null } });
        if (!existingRegion) {
            return res.status(404).json({ message: 'Region not found or already deleted' });
        }

        // If companyId is provided, check if the company exists
        if (companyId) {
            const company = await Company.findByPk(companyId);
            if (!company) {
                return res.status(400).json({ message: 'Company not found' });
            }
            await Region.update({ ...regionData, companyId }, {
                where: { id: regionId, deletedAt: null },
            });
        } else {
            await Region.update(regionData, {
                where: { id: regionId, deletedAt: null },
            });
        }

        const updatedRegion = await Region.findByPk(regionId, { include: [{ model: Company, as: 'company' }] });
        res.status(200).json(updatedRegion);
    } catch (error) {
        console.error('Error updating region:', error);
        res.status(500).json({ message: 'Failed to update region', error: error.errors });
    }
};

// Soft Delete Region
exports.softDeleteRegion = async (req, res) => {
    await softDelete(Region, req.params.id, res);
};

// Get all Regions for a specific company
exports.getRegionsByCompany = async (req, res) => {
    const { companyId } = req.params;
    try {
        const company = await Company.findByPk(companyId);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const regions = await Region.findAll({
            where: { companyId: companyId, deletedAt: null },
            include: [{ model: Company, as: 'company' }],
        });
        res.status(200).json(regions);
    } catch (error) {
        console.error('Error fetching regions by company:', error);
        res.status(500).json({ message: 'Failed to fetch regions for this company' });
    }
};
