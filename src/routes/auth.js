const express = require('express');
const router = express.Router();
const {
    register, verifyEmail, login,
    forgotPassword, verifyResetOtp, resetPassword, resendOtp, me
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { attachRoleAndPermissions } = require('../middleware/rbac');

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);
router.post('/resend-otp', resendOtp);

// Used by both the public site and the admin panel to check "who am I,
// what role/permissions do I have right now" — always live, never cached
// in the token itself.
router.get('/me', requireAuth, attachRoleAndPermissions, me);

module.exports = router;
