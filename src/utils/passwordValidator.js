// ─── Password validation ────────────────────────────────────────────────────
// Goal: don't force uppercase/lowercase/number/special-char combos on users,
// but block passwords that are trivially weak (all-numeric, all-same-char,
// simple sequences, or well-known common passwords).

const MIN_LENGTH = 6;

// Well-known / commonly-used weak passwords (checked case-insensitively).
const COMMON_WEAK_PASSWORDS = new Set([
    'password', 'passwords', 'password1', 'password123',
    '123456', '1234567', '12345678', '123456789', '1234567890',
    '111111', '11111111', '000000', '00000000',
    'qwerty', 'qwerty123', 'qazwsx',
    'abc123', 'abcd1234', 'iloveyou',
    'letmein', 'welcome', 'admin', 'admin123',
    '1q2w3e4r', '123123', '12345',
]);

// True if the whole string is a run of ascending or descending
// consecutive characters, e.g. "12345678", "87654321", "abcdefgh".
function isSequential(str) {
    if (str.length < 4) return false;
    let ascending = true;
    let descending = true;
    for (let i = 1; i < str.length; i++) {
        const diff = str.charCodeAt(i) - str.charCodeAt(i - 1);
        if (diff !== 1) ascending = false;
        if (diff !== -1) descending = false;
    }
    return ascending || descending;
}

/**
 * Validates a password against the app's weak-password rules.
 * Does NOT require mixed case, numbers, or special characters.
 * @param {string} password
 * @returns {{ valid: boolean, message?: string }}
 */
function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        return { valid: false, message: 'Password is required.' };
    }

    if (password.length < MIN_LENGTH) {
        return { valid: false, message: `Password must be at least ${MIN_LENGTH} characters.` };
    }

    if (/^\d+$/.test(password)) {
        return { valid: false, message: 'Password cannot be entirely numbers. Please add some letters.' };
    }

    if (/^(.)\1+$/.test(password)) {
        return { valid: false, message: 'Password cannot be the same character repeated. Please choose something less predictable.' };
    }

    const lower = password.toLowerCase();

    if (COMMON_WEAK_PASSWORDS.has(lower)) {
        return { valid: false, message: 'This password is too common. Please choose something less predictable.' };
    }

    if (isSequential(lower)) {
        return { valid: false, message: 'Password cannot be a simple sequence (e.g. 12345678, abcdefgh).' };
    }

    return { valid: true };
}

module.exports = { validatePassword };
