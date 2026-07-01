const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { sendOtpEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'divineconnect_secret_2026';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function signToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, full_name: user.full_name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
    );
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
async function register(req, res) {
    try {
        const { full_name, email, password } = req.body;

        if (!full_name || !email || !password)
            return res.status(400).json({ error: 'All fields are required.' });

        if (password.length < 6)
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });

        const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (exists.rows.length > 0)
            return res.status(409).json({ error: 'An account with this email already exists.' });

        const hash = await bcrypt.hash(password, 12);
        const { rows } = await pool.query(
            `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3) RETURNING id, full_name, email, is_verified`,
            [full_name.trim(), email.toLowerCase(), hash]
        );
        const user = rows[0];

        // Generate and save OTP
        const otp = generateOtp();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        await pool.query(
            `INSERT INTO otps (email, otp, type, expires_at) VALUES ($1, $2, 'email_verify', $3)`,
            [email.toLowerCase(), otp, expires]
        );

        // Try sending email — if SMTP not configured, log OTP to console as fallback
        let emailSent = false;
        try {
            await sendOtpEmail(email, full_name, otp, 'verify');
            emailSent = true;
        } catch (emailErr) {
            console.warn('⚠️  SMTP not configured. OTP for development:');
            console.warn(`    Email : ${email}`);
            console.warn(`    OTP   : ${otp}`);
        }

        const token = signToken(user);
        res.status(201).json({
            message: emailSent
                ? 'Account created! Please verify your email with the OTP sent.'
                : 'Account created! Check the server console for your OTP (dev mode).',
            token,
            devOtp: emailSent ? undefined : otp,
            user: { id: user.id, full_name: user.full_name, email: user.email, is_verified: false },
        });
    } catch (err) {
        console.error('register error:', err);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
}

// ─── POST /api/auth/verify-email ──────────────────────────────────────────────
async function verifyEmail(req, res) {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });

        const { rows } = await pool.query(
            `SELECT * FROM otps WHERE email=$1 AND type='email_verify' AND used=FALSE ORDER BY id DESC LIMIT 1`,
            [email.toLowerCase()]
        );
        if (!rows.length) return res.status(400).json({ error: 'No OTP found. Please request a new one.' });

        const record = rows[0];
        if (new Date() > new Date(record.expires_at))
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        if (record.otp !== otp)
            return res.status(400).json({ error: 'Invalid OTP. Please try again.' });

        await pool.query(`UPDATE otps SET used=TRUE WHERE id=$1`, [record.id]);
        await pool.query(`UPDATE users SET is_verified=TRUE, updated_at=NOW() WHERE email=$1`, [email.toLowerCase()]);

        res.json({ message: 'Email verified successfully! You can now sign in.' });
    } catch (err) {
        console.error('verifyEmail error:', err);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: 'Email and password are required.' });

        const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email.toLowerCase()]);
        if (!rows.length)
            return res.status(401).json({ error: 'No account found with this email.' });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match)
            return res.status(401).json({ error: 'Incorrect password.' });

        if (!user.is_verified)
            return res.status(403).json({ error: 'EMAIL_NOT_VERIFIED', email: user.email });

        const token = signToken(user);
        res.json({
            message: 'Welcome back!',
            token,
            user: { id: user.id, full_name: user.full_name, email: user.email, is_verified: user.is_verified },
        });
    } catch (err) {
        console.error('login error:', err);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
}

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required.' });

        const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email.toLowerCase()]);
        // Always return success to prevent email enumeration
        if (!rows.length)
            return res.json({ message: 'If this email is registered, you will receive an OTP.' });

        const user = rows[0];
        const otp = generateOtp();
        const expires = new Date(Date.now() + 10 * 60 * 1000);

        // Invalidate old OTPs
        await pool.query(`UPDATE otps SET used=TRUE WHERE email=$1 AND type='forgot_password'`, [email.toLowerCase()]);
        await pool.query(
            `INSERT INTO otps (email, otp, type, expires_at) VALUES ($1, $2, 'forgot_password', $3)`,
            [email.toLowerCase(), otp, expires]
        );
        await sendOtpEmail(email, user.full_name, otp, 'reset');

        res.json({ message: 'OTP sent to your email. It expires in 10 minutes.' });
    } catch (err) {
        console.error('forgotPassword error:', err);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
}

// ─── POST /api/auth/verify-reset-otp ─────────────────────────────────────────
async function verifyResetOtp(req, res) {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });

        const { rows } = await pool.query(
            `SELECT * FROM otps WHERE email=$1 AND type='forgot_password' AND used=FALSE ORDER BY id DESC LIMIT 1`,
            [email.toLowerCase()]
        );
        if (!rows.length) return res.status(400).json({ error: 'No OTP found. Please request a new one.' });

        const record = rows[0];
        if (new Date() > new Date(record.expires_at))
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        if (record.otp !== otp)
            return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });

        // Mark as used so reset-password can proceed
        await pool.query(`UPDATE otps SET used=TRUE WHERE id=$1`, [record.id]);

        // Issue a short-lived reset token
        const resetToken = jwt.sign({ email: email.toLowerCase(), purpose: 'reset' }, JWT_SECRET, { expiresIn: '15m' });
        res.json({ message: 'OTP verified.', resetToken });
    } catch (err) {
        console.error('verifyResetOtp error:', err);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
}

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
async function resetPassword(req, res) {
    try {
        const { resetToken, password } = req.body;
        if (!resetToken || !password)
            return res.status(400).json({ error: 'Reset token and new password are required.' });
        if (password.length < 6)
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });

        let decoded;
        try {
            decoded = jwt.verify(resetToken, JWT_SECRET);
        } catch {
            return res.status(400).json({ error: 'Reset link has expired. Please start over.' });
        }
        if (decoded.purpose !== 'reset')
            return res.status(400).json({ error: 'Invalid reset token.' });

        const hash = await bcrypt.hash(password, 12);
        await pool.query(`UPDATE users SET password_hash=$1, updated_at=NOW() WHERE email=$2`, [hash, decoded.email]);

        res.json({ message: 'Password reset successfully! You can now sign in with your new password.' });
    } catch (err) {
        console.error('resetPassword error:', err);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
}

// ─── POST /api/auth/resend-otp ────────────────────────────────────────────────
async function resendOtp(req, res) {
    try {
        const { email, type } = req.body;
        if (!email || !type) return res.status(400).json({ error: 'Email and type are required.' });

        const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email.toLowerCase()]);
        if (!rows.length) return res.status(404).json({ error: 'Account not found.' });

        const user = rows[0];
        const otp = generateOtp();
        const expires = new Date(Date.now() + 10 * 60 * 1000);

        await pool.query(`UPDATE otps SET used=TRUE WHERE email=$1 AND type=$2`, [email.toLowerCase(), type]);
        await pool.query(`INSERT INTO otps (email, otp, type, expires_at) VALUES ($1,$2,$3,$4)`,
            [email.toLowerCase(), otp, type, expires]);
        await sendOtpEmail(email, user.full_name, otp, type === 'email_verify' ? 'verify' : 'reset');

        res.json({ message: 'A new OTP has been sent to your email.' });
    } catch (err) {
        console.error('resendOtp error:', err);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
}

module.exports = { register, verifyEmail, login, forgotPassword, verifyResetOtp, resetPassword, resendOtp };