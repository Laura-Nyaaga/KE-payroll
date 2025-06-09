const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { User } = require('../models'); // Import your User model
dotenv.config();

// Middleware for authentication using cookies
const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  
  if (!token) {
    console.log('No token found in cookies for this request.'); // ADD THIS LINE
    return res.status(403).send({ message: 'No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized!' });
    }
    try {
      const user = await User.findByPk(decoded.userId);
      if (!user) {
        return res.status(404).send({ message: 'User not found.' });
      }
      req.user = user; // Attach the entire user object to req.user
      req.role = decoded.role; // Assuming the token payload contains user role
      next();
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).send({ message: 'Internal server error.' });
    }
  });
};

// RBAC Middleware (remains the same)
const rbacMiddleware = (requiredRoles) => {
  return (req, res, next) => {
    if (req.role && (Array.isArray(requiredRoles) ? requiredRoles.includes(req.role) : req.role === requiredRoles)) {
      next();
    } else {
      return res.status(403).send({ message: 'Access denied!' });
    }
  };
};

module.exports = {
  authMiddleware,
  rbacMiddleware,
};