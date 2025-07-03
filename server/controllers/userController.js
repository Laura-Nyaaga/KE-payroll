const { User, Company } = require("../models");
const softDelete = require("../utils/softDelete");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendWelcomeEmail } = require("../utils/mailer");

exports.createUser = async (req, res) => {
  try {
    const { password, email, ...userData } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      ...userData,
      email,
      password: hashedPassword,
    });

    const UserResponse = newUser.toJSON();
    delete UserResponse.password;
    delete UserResponse.resetToken;
    delete UserResponse.resetTokenExpiry;

    try {
      await sendWelcomeEmail({ user: newUser });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    

    res
      .status(201)
      .json({ message: "User created successfully", user: UserResponse });
  } catch (error) {
    console.error("Error creating user:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors.map((err) => ({
          field: err.path,
          message: err.message,
        })),
      });
    }

    if (error.errors) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors.map((err) => ({
          field: err.path,
          message: err.message,
        })),
      });
    }

    res.status(500).json({
      message: "Failed to create user",
      error: error.message,
    });
  }
};

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { deletedAt: null },
      attributes: { exclude: ["password", "resetToken", "resetTokenExpiry"] },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// GET USER BY ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      where: { deletedAt: null },
      attributes: { exclude: ["password", "resetToken", "resetTokenExpiry"] },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

// GET USERS BY COMPANY ID
exports.getUsersByCompanyId = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { companyId: req.params.companyId, deletedAt: null },
      attributes: { exclude: ["password", "resetToken", "resetTokenExpiry"] },
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users by company ID:", error);
    res.status(500).json({ message: "Failed to fetch users by company ID" });
  }
};

// UPDATE USER DETAILS
exports.updateUser = async (req, res) => {
  try {
    const { password, ...userData } = req.body;
    let updateData = userData;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    const [updatedRows] = await User.update(updateData, {
      where: { id: req.params.id, deletedAt: null },
      attributes: { exclude: ["password", "resetToken", "resetTokenExpiry"] },
    });
    if (updatedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const updatedUser = await User.findByPk(req.params.id);
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res
      .status(500)
      .json({ message: "Failed to update user", error: error.errors });
  }
};

// SOFT DELETING
exports.softDeleteUser = async (req, res) => {
  await softDelete(User, req.params.id, res);
};
