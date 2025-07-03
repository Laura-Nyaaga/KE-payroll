const { Op } = require("sequelize");

const { User, Company } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendResetEmail } = require("../utils/emailService");

const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    let userFound = false; // Flag to indicate if a user or company record was found by email

    // --- Helper function to check lockout status ---
    const isLocked = (record) => {
      return record.lockUntil && record.lockUntil > new Date();
    };

    // --- Helper function to handle failed login attempts ---
    const handleFailedLogin = async (record, recordType) => {
      record.failedLoginAttempts += 1;
      if (record.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        record.lockUntil = new Date(Date.now() + LOCK_TIME);
        record.failedLoginAttempts = 0; // Reset attempts after locking
        await record.save();
        return res.status(403).json({
          message: `Too many failed login attempts. Your ${recordType} account is locked for ${LOCK_TIME / 60000} minutes.`,
        });
      }
      await record.save();
      return res.status(401).json({
        message: `Invalid credentials. You have ${MAX_LOGIN_ATTEMPTS - record.failedLoginAttempts} attempts remaining.`,
      });
    };

    // --- Attempt 1: Find a User (regular user or SuperAdmin linked to user) ---
    const user = await User.findOne({ where: { email, deletedAt: null } });

    if (user) {
      userFound = true;
      if (isLocked(user)) {
        return res.status(403).json({
          message: `Your account is locked due to too many failed attempts. Please try again after ${Math.ceil((user.lockUntil - new Date()) / 60000)} minutes.`,
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        // Successful login: Reset failed attempts
        user.failedLoginAttempts = 0;
        user.lockUntil = null; // Clear lock
        await user.save();

        let tokenPayload = {
          userId: user.id,
          email: user.email,
          role: user.role,
        };

        // Check if user is a SuperAdmin, and enrich payload with company info
        if (user.role === "SuperAdmin" && user.companyId) {
          const company = await Company.findOne({
            where: { id: user.companyId, deletedAt: null },
            attributes: ["id", "name", "industryCategory", "email"],
          });

          if (!company) {
            return res.status(403).json({ message: "Company not found for SuperAdmin" });
          }

          tokenPayload = {
            ...tokenPayload,
            companyId: company.id,
            role: user.role,
            email: company.email, // Use company email for SuperAdmin
            isSuperUser: true,
          };
        }

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "8h" });

        res.cookie("token", token, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === 'production', // Set to true in production
          maxAge: 8 * 60 * 60 * 1000,
        });

        // Response for SuperAdmin
        if (user.role === "SuperAdmin") {
          const company = await Company.findOne({ where: { id: user.companyId } }); // Re-fetch company for response
          return res.status(200).json({
            message: "SuperAdmin login successful",
            company: {
              id: company.id,
              name: company.name,
              industry: company.industryCategory,
            },
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
            },
          });
        }

        // Response for regular user
        return res.status(200).json({
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        });
      } else {
        // User password mismatch
        return handleFailedLogin(user, 'user');
      }
    }

    // --- Attempt 2: If no User found, try to find a Company with that email (for Company SuperAdmin fallback) ---
    const company = await Company.findOne({
      where: { email, deletedAt: null },
      attributes: ["id", "name", "email", "password", "industryCategory", "failedLoginAttempts", "lockUntil"],
    });

    if (company) {
      userFound = true;
      if (isLocked(company)) {
        return res.status(403).json({
          message: `This company account is locked due to too many failed attempts. Please try again after ${Math.ceil((company.lockUntil - new Date()) / 60000)} minutes.`,
        });
      }

      const isCompanyPasswordMatch = await bcrypt.compare(password, company.password);

      if (isCompanyPasswordMatch) {
        // Successful login: Reset failed attempts for the company
        company.failedLoginAttempts = 0;
        company.lockUntil = null; // Clear lock
        await company.save();

        // Try to find SuperAdmin user linked to this company
        const superAdmin = await User.findOne({
          where: {
            companyId: company.id,
            email: company.email,
            role: "SuperAdmin",
            deletedAt: null,
          },
        });

        if (!superAdmin) {
          // This scenario indicates a data inconsistency, company exists but no linked SuperAdmin
          return res.status(403).json({ message: "No SuperAdmin user found for this company" });
        }

        const tokenPayload = {
          companyId: company.id,
          userId: superAdmin.id,
          email: company.email,
          role: superAdmin.role,
          isSuperUser: true,
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "8h" });

        res.cookie("token", token, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === 'production', // Set to true in production
          maxAge: 8 * 60 * 60 * 1000,
        });

        return res.status(200).json({
          message: "Login successful",
          company: {
            id: company.id,
            name: company.name,
            industry: company.industryCategory,
          },
          user: {
            id: superAdmin.id,
            firstName: superAdmin.firstName,
            lastName: superAdmin.lastName,
            role: superAdmin.role,
          },
        });
      } else {
        // Company password mismatch
        return handleFailedLogin(company, 'company');
      }
    }
    if (!userFound) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Failed to process login", error: error.message });
  }
};

exports.verify = async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(200).json({ isAuthenticated: false, user: null, company: null, tokenData: null });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            // Token is invalid or expired
            res.clearCookie('token', { 
              httpOnly: true, 
              sameSite: 'lax',
              secure: false // Set to true in production with HTTPS
            }); // Clear invalid cookie
            return res.status(200).json({ isAuthenticated: false, user: null, company: null, tokenData: null });
        }

        const userId = decoded.userId;
        const companyIdFromToken = decoded.companyId; // May or may not be present

        let user = null;
        let company = null;

        // Fetch user data
        user = await User.findOne({
            where: { id: userId, deletedAt: null },
            attributes: ["id", "firstName", "lastName", "email", "role", "companyId"],
        });

        if (!user) {
            res.clearCookie('token', { httpOnly: true, sameSite: 'strict' }); // Clear cookie if user not found
            return res.status(200).json({ isAuthenticated: false, user: null, company: null, tokenData: null });
        }

        // Fetch company data if applicable (SuperAdmin or company-linked user)
        if (user.companyId || companyIdFromToken) {
            const effectiveCompanyId = user.companyId || companyIdFromToken;
            company = await Company.findOne({
                where: { id: effectiveCompanyId, deletedAt: null },
                attributes: ["id", "name", "industryCategory", "email"],
            });

        }

        // Construct user and company objects to send to frontend
        const userResponse = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            // Do NOT send user.password or sensitive info
        };

        const companyResponse = company ? {
            id: company.id,
            name: company.name,
            industry: company.industryCategory,
            email: company.email,
        } : null;

        return res.status(200).json({
            isAuthenticated: true,
            user: userResponse,
            company: companyResponse,
            tokenData: decoded // The decoded payload of the token
        });

    } catch (error) {
        console.error("Auth verification error:", error);
        res.clearCookie('token', { httpOnly: true, sameSite: 'strict' }); // Clear cookie on unexpected errors
        return res.status(500).json({ message: "Failed to verify authentication", error: error.message });
    }
};

// Get current user information
exports.me = async (req, res) => {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({ message: "No authentication token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findOne({
            where: { id: decoded.userId, deletedAt: null },
            attributes: ["id", "firstName", "lastName", "email", "role", "companyId", "createdAt"]
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // If SuperAdmin, include company info
        if (user.role === "SuperAdmin" && (user.companyId || decoded.companyId)) {
            const companyId = user.companyId || decoded.companyId;
            const company = await Company.findOne({
                where: { id: companyId, deletedAt: null },
                attributes: ["id", "name", "industryCategory", "email", "createdAt"]
            });

            return res.status(200).json({
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    createdAt: user.createdAt
                },
                company: company ? {
                    id: company.id,
                    name: company.name,
                    industry: company.industryCategory,
                    email: company.email,
                    createdAt: company.createdAt
                } : null
            });
        }

        // Regular user
        return res.status(200).json({
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error("Get user error:", error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid authentication token" });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Authentication token expired" });
        }
        
        return res.status(500).json({ message: "Failed to get user information", error: error.message });
    }
};

// authController.js (or similar)
exports.logout = (req, res) => {
    try {
        // Clear the token cookie
        res.clearCookie('token', { 
          httpOnly: true, 
          sameSite: 'lax',
          secure: false // Set to true in production with HTTPS
         });
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ message: "Failed to process logout", error: error.message });
    }
};


exports.resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "Token, new password, and confirm password are required." });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  try {
    const now = Date.now();

    let account = await User.findOne({
      where: { resetToken: token, resetTokenExpiry: { [Op.gt]: now }, deletedAt: null },
    }) || await Company.findOne({
      where: { resetToken: token, resetTokenExpiry: { [Op.gt]: now }, deletedAt: null },
    });

    if (!account) return res.status(400).json({ message: 'Invalid or expired token.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await account.update({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    return res.status(200).json({ success: true, message: 'Password reset successful.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};



exports.sendResetPasswordEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    let account = await User.findOne({ where: { email, deletedAt: null } }) || 
                  await Company.findOne({ where: { email, deletedAt: null } });

    if (!account) return res.status(404).json({ message: 'Account not found.' });

    const token = crypto.randomBytes(32).toString('hex');
const resetUrl = `https://mobilitysolutionske.com/auth/reset-password?token=${token}`;

    // Store token and expiry on the user (you can create a PasswordReset model too)
    account.resetToken = token;
    account.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await account.save();

    await sendResetEmail(account, resetUrl); // Implement this

    return res.status(200).json({ message: 'Password reset email sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send reset email.' });
  }
};