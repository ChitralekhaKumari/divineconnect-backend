const express = require('express');
const router = express.Router();
const {
    register, verifyEmail, login,
    forgotPassword, verifyResetOtp, resetPassword, resendOtp
} = require('../controllers/authController');

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);
router.post('/resend-otp', resendOtp);

module.exports = router;
