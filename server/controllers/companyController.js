const { Company, User, sequelize } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Create Company (Registration) with Super User
exports.createCompany = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        // Validate input
        const { password, ...companyData } = req.body;

        if (!password) {
            await transaction.rollback();
            return res.status(400).json({ 
                message: 'Password is required', 
                error: 'No password provided' 
            });
        }

        // Validate password strength
        if (password.length < 8) {
            await transaction.rollback();
            return res.status(400).json({ 
                message: 'Password must be at least 8 characters long', 
                error: 'Weak password' 
            });
        }
        // Hash the password
        const hashedPassword = await bcrypt.hash(password.trim(), 12);
        // Create the company
        const newCompany = await Company.create({ 
            ...companyData, 
            password: hashedPassword 
        }, { transaction });
        // Create Super User (SuperAdmin) for the company
        const superUser = await User.create({
            companyId: newCompany.id,
            firstName: 'SuperAdmin',
            lastName: companyData.name,
            email: companyData.email,
            password: hashedPassword, // Same password as company for initial login
            role: 'SuperAdmin',
            createdAt: new Date(),
            updatedAt: new Date()
        }, { transaction });

        await transaction.commit();
        
        // Remove sensitive data from response
        const companyResponse = newCompany.toJSON();
        delete companyResponse.password;
        const userResponse = superUser.toJSON();
        delete userResponse.password;

        res.status(201).json({ 
            message: 'Company and super user created successfully', 
            company: companyResponse,
            superUser: userResponse
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating company and super user:', error);
        
        let errorMessage = 'Failed to create company';
        if (error.name === 'SequelizeUniqueConstraintError') {
            errorMessage = 'Company with this email or registration number already exists';
        }

        res.status(500).json({ 
            message: errorMessage, 
            error: error.message,
            details: error.errors ? error.errors.map(e => e.message) : null
        });
    }
};


// Get all Companies
exports.getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.findAll({ 
            where: { deletedAt: null },
            attributes: { exclude: ['password'] } // Never return passwords
        });
        res.status(200).json(companies);
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ message: 'Failed to fetch companies' });
    }
};

// Get Company by ID
exports.getCompanyById = async (req, res) => {
    try {
        const company = await Company.findByPk(req.params.id, { 
            where: { deletedAt: null },
            attributes: { exclude: ['password'] } // Never return password
        });
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.status(200).json(company);
    } catch (error) {
        console.error('Error fetching company by ID:', error);
        res.status(500).json({ message: 'Failed to fetch company' });
    }
};

// Update Company
exports.updateCompany = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { password, ...companyData } = req.body;
        let updateData = companyData;
        
        if (password) {
            if (password.length < 8) {
                await transaction.rollback();
                return res.status(400).json({ 
                    message: 'Password must be at least 8 characters long' 
                });
            }
            updateData.password = await bcrypt.hash(password, 12);
        }

        const [updatedRows] = await Company.update(updateData, {
            where: { id: req.params.id, deletedAt: null },
            transaction
        });

        if (updatedRows === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Company not found or already deleted' });
        }

        // If email was updated, also update the super user email
        if (companyData.email) {
            await User.update(
                { email: companyData.email },
                { 
                    where: { 
                        companyId: req.params.id, 
                        role: 'SuperAdmin',
                        deletedAt: null 
                    },
                    transaction
                }
            );
        }

        await transaction.commit();
        
        const updatedCompany = await Company.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });
        
        res.status(200).json(updatedCompany);
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating company:', error);
        res.status(500).json({ 
            message: 'Failed to update company', 
            error: error.errors 
        });
    }
};

// Soft Delete Company (and associated users)
exports.softDeleteCompany = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const now = new Date();
        
        // Soft delete the company
        const [companyUpdated] = await Company.update(
            { deletedAt: now },
            { where: { id: req.params.id }, transaction }
        );
        
        if (companyUpdated === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Company not found' });
        }
        
        // Soft delete all users associated with this company
        await User.update(
            { deletedAt: now },
            { where: { companyId: req.params.id }, transaction }
        );
        
        await transaction.commit();
        res.status(200).json({ message: 'Company and associated users deleted successfully' });
    } catch (error) {
        await transaction.rollback();
        console.error('Error soft deleting company:', error);
        res.status(500).json({ message: 'Failed to delete company' });
    }
};






















