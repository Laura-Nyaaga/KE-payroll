const { User } = require("../models");
const softDelete = require("../utils/softDelete");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// REGISTER USER
exports.createUser = async (req, res) => {
  try {
    const { password, ...userData } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      ...userData,
      password: hashedPassword,
    });

    const UserResponse = newUser.toJSON();
        delete UserResponse.password;

    res
      .status(201)
      .json({ message: "User created successfully", user: UserResponse });
  } catch (error) {
    console.error("Error creating user:", error);
    res
      .status(500)
      .json({ message: "Failed to create user", error: error.errors });
  }
};

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ where: { deletedAt: null }, attributes: { exclude: ["password"] } });
    
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
      where: { deletedAt: null }, attributes: { exclude: ["password"] }
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
      attributes: { exclude: ["password"] },
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

// USER LOGIN
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    // const company = await Company.findOne({ where: { deletedAt: null },
    //   attributes: ['id', 'name','industryCategory'] });
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // console.log("User esxists:", user);

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.cookie("token", token, {
      httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });
    res
      .status(200)
      .json({
        message: "Login successful",
        // company: {companyId: company.id, companyName: co.company.name, industryCategory: company.industryCategory},
        user: { id: user.id, email: user.email, role: user.role },
      });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Failed to login" });
  }
};
// USER LOGOUT
exports.logoutUser = (req, res) => {
  res.clearCookie("authToken");
  res.status(200).json({ message: "Logout successful" });
};
