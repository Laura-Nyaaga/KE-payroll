const { Op } = require('sequelize');
const { Region, Company } = require('../models');
const softDelete = require('../utils/softDelete');

// Create Region for a specific company
exports.createRegion = async (req, res) => {
  try {
    const { companyId, name, ...rest } = req.body;

    // Check if the company exists
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(400).json({ message: 'Company not found' });
    }

    // Check for duplicate region name in the same company
    const existingRegion = await Region.findOne({
      where: {
        companyId,
        name,
        deletedAt: null
      }
    });

    if (existingRegion) {
      return res.status(409).json({
        message: 'A region with this name already exists in this company.'
      });
    }

    const newRegion = await Region.create({ ...rest, name, companyId });
    res.status(201).json(newRegion);
  } catch (error) {
    console.error('Error creating region:', error);
    res.status(500).json({
      message: 'Failed to create region',
      error: error?.errors || error.message
    });
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
    const { companyId, name, ...rest } = req.body;
    const regionId = req.params.id;

    // Fetch the region to be updated
    const existingRegion = await Region.findByPk(regionId);
    if (!existingRegion || existingRegion.deletedAt) {
      return res.status(404).json({ message: 'Region not found or already deleted' });
    }

    const effectiveCompanyId = companyId || existingRegion.companyId;

    // Validate the company if companyId is changing
    if (companyId && companyId !== existingRegion.companyId) {
      const company = await Company.findByPk(companyId);
      if (!company) {
        return res.status(400).json({ message: 'Company not found' });
      }
    }

    // Check for name conflict in the same company
    if (name) {
      const conflict = await Region.findOne({
        where: {
          name,
          companyId: effectiveCompanyId,
          id: { [Op.ne]: regionId },
          deletedAt: null
        }
      });

      if (conflict) {
        return res.status(409).json({
          message: 'Another region with this name already exists in this company.'
        });
      }
    }

    await Region.update(
      { ...rest, name, companyId: effectiveCompanyId },
      { where: { id: regionId } }
    );

    const updatedRegion = await Region.findByPk(regionId, {
      include: [{ model: Company, as: 'company' }]
    });

    res.status(200).json(updatedRegion);
  } catch (error) {
    console.error('Error updating region:', error);
    res.status(500).json({
      message: 'Failed to update region',
      error: error?.errors || error.message
    });
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
