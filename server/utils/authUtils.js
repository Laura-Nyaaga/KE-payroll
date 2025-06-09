const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User, Company } = require("../models"); // Ensure these models are properly imported

/**
 * General Login Function
 * @param {string} email - The user's email
 * @param {string} password - The user's password
 * @param {string} type - "user" or "company"
 * @returns {Promise<{status: number, data: object}>}
 */
exports.generalLogin = async (email, password, type) => {
  try {
    if (!email || !password || !type) {
      return { status: 400, data: { message: "Email, password, and type are required" } };
    }

    let entity, tokenPayload = {}, tokenExpiry = "1h";

    if (type === "company") {
      entity = await Company.findOne({
        where: { email, deletedAt: null },
        attributes: ["id", "name", "email", "password", "industryCategory"],
      });

      if (!entity) return { status: 401, data: { message: "Invalid credentials" } };

      const adminUser = await User.findOne({
        where: { companyId: entity.id, email: entity.email, role: "SuperAdmin", deletedAt: null },
      });

      if (!adminUser) return { status: 403, data: { message: "No admin user found for this company" } };

      tokenPayload = {
        companyId: entity.id,
        userId: adminUser.id,
        email: entity.email,
        role: adminUser.role,
        isSuperUser: true,
      };
      tokenExpiry = "8h";
    } else if (type === "user") {
      entity = await User.findOne({ where: { email } });

      if (!entity) return { status: 401, data: { message: "Invalid credentials" } };

      tokenPayload = {
        userId: entity.id,
        email: entity.email,
        role: entity.role,
      };
    } else {
      return { status: 400, data: { message: "Invalid login type" } };
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, entity.password);
    if (!passwordMatch) return { status: 401, data: { message: "Invalid credentials" } };

    // Generate JWT Token
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: tokenExpiry });

    return { status: 200, data: { token, user: tokenPayload, message: "Login successful" } };
  } catch (error) {
    console.error("Login error:", error);
    return { status: 500, data: { message: "Failed to process login", error: error.message } };
  }
};

/**
 * General Logout Function
 * @param {object} res - Express response object
 */
exports.generalLogout = (res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    sameSite: "strict",
  });

  res.status(200).json({ message: "Logout successful" });
};
