// routes/auth.js (or wherever you define your auth routes)
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // Adjust path as needed
const { authMiddleware } = require('../middlewares/authMiddleware');

// Public routes
router.post('/login', authController.login);
router.post('/logout',  authController.logout);

// Protected routes - these require authentication
router.get('/verify', authMiddleware, authController.verify);
router.get('/me', authMiddleware, authController.me);
router.post('/reset-password', authController.resetPassword);
router.post( '/request-password', authController.sendResetPasswordEmail);

module.exports = router;


