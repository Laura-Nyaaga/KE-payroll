const { User, Company } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Your existing login function (unchanged)
exports.login = async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password)
        return res.status(400).json({ message: "Email and password are required" });
  
      // First: Try to find a User with that email
      const user = await User.findOne({ where: { email, deletedAt: null } });
  
      if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
          return res.status(401).json({ message: "Invalid credentials" });
  
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
  
          if (!company)
            return res.status(403).json({ message: "Company not found for SuperAdmin" });
  
          tokenPayload = {
            ...tokenPayload,
            companyId: company.id,
            role: user.role,
            email: company.email, // Use company email for SuperAdmin
            isSuperUser: true,
          };
  
          // res.cookie("token", jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "8h" }), {
          //   httpOnly: true,
          //   sameSite: "lax",
          //   maxAge: 8 * 60 * 60 * 1000,
          // });


      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "8h" });

      // *** CRITICAL CHANGE HERE ***
      res.cookie("token", token, {
        httpOnly: true,
        // For development, use "lax" if your frontend and backend are on different domains/IPs
        // (e.g., localhost:3000 vs 192.168.100.84:4000)
        sameSite: "lax",
        // Only set `secure: true` if your frontend and backend are both running over HTTPS.
        // Since you are using http://localhost:3000, keep this false for development.
        // In production, when using HTTPS, set this to true.
        secure: false, // <-- Set to false for HTTP development environments
        maxAge: 8 * 60 * 60 * 1000,
      });
  
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
  
        // Regular user login
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "8h" });
  
        res.cookie("token", token, {
          httpOnly: true,
          sameSite: "lax",
          maxAge: 8 * 60 * 60 * 1000,
          secure: false, // Set to true in production with HTTPS
        });
  
        return res.status(200).json({
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        });
      }
  
      // If no user found, fallback to company login for edge cases
      const company = await Company.findOne({
        where: { email, deletedAt: null },
        attributes: ["id", "name", "email", "password", "industryCategory"],
      });
  
      if (!company || !company.password)
        return res.status(401).json({ message: "Invalid credentials" });
  
      const isCompanyPasswordMatch = await bcrypt.compare(password, company.password);
      if (!isCompanyPasswordMatch)
        return res.status(401).json({ message: "Invalid credentials" });
  
      // Try to find SuperAdmin user linked to this company
      const superAdmin = await User.findOne({
        where: {
          companyId: company.id,
          email: company.email,
          role: "SuperAdmin",
          deletedAt: null,
        },
      });
  
      if (!superAdmin)
        return res.status(403).json({ message: "No SuperAdmin user found for this company" });
  
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
        maxAge: 8 * 60 * 60 * 1000,
        secure: false, // Set to true in production with HTTPS
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
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Email, new password, and confirm password are required." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    let accountType = null;
    let account = null;

    account = await User.findOne({ where: { email, deletedAt: null } });
    if (account) accountType = "user";

    if (!account) {
      account = await Company.findOne({ where: { email, deletedAt: null } });
      if (account) accountType = "company";
    }

    if (!account) {
      return res.status(404).json({ message: "No user or company found with this email." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await account.update({ password: hashedPassword });

    return res.status(200).json({
      success: true,
      message: `Password reset successful for ${accountType}.`,
    });

  } catch (error) {
    console.error("Password reset error:", error);
    return res.status(500).json({ message: "Failed to reset password.", error: error.message });
  }
};


