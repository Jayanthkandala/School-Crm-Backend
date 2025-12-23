/**
 * Account Lockout Utility
 * Prevents brute force attacks by tracking failed login attempts
 */

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const ATTEMPT_WINDOW = 15 * 60 * 1000; // Track attempts within 15 minutes

// In-memory store (in production, use Redis)
const loginAttempts = new Map();
const lockedAccounts = new Map();

/**
 * Record a failed login attempt
 */
function recordFailedAttempt(identifier) {
    const now = Date.now();

    if (!loginAttempts.has(identifier)) {
        loginAttempts.set(identifier, []);
    }

    const attempts = loginAttempts.get(identifier);

    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(timestamp => now - timestamp < ATTEMPT_WINDOW);

    // Add current attempt
    recentAttempts.push(now);

    loginAttempts.set(identifier, recentAttempts);

    // Check if account should be locked
    if (recentAttempts.length >= MAX_LOGIN_ATTEMPTS) {
        lockAccount(identifier);
        return {
            locked: true,
            remainingAttempts: 0,
            lockoutDuration: LOCKOUT_DURATION / 1000 / 60 // in minutes
        };
    }

    return {
        locked: false,
        remainingAttempts: MAX_LOGIN_ATTEMPTS - recentAttempts.length,
        lockoutDuration: null
    };
}

/**
 * Lock an account
 */
function lockAccount(identifier) {
    const lockUntil = Date.now() + LOCKOUT_DURATION;
    lockedAccounts.set(identifier, lockUntil);

    console.warn(`Account locked: ${identifier} until ${new Date(lockUntil).toISOString()}`);
}

/**
 * Check if account is locked
 */
function isAccountLocked(identifier) {
    if (!lockedAccounts.has(identifier)) {
        return { locked: false };
    }

    const lockUntil = lockedAccounts.get(identifier);
    const now = Date.now();

    if (now >= lockUntil) {
        // Lock expired, remove it
        lockedAccounts.delete(identifier);
        loginAttempts.delete(identifier);
        return { locked: false };
    }

    const remainingTime = Math.ceil((lockUntil - now) / 1000 / 60); // in minutes

    return {
        locked: true,
        remainingTime,
        lockUntil: new Date(lockUntil).toISOString()
    };
}

/**
 * Reset login attempts (on successful login)
 */
function resetAttempts(identifier) {
    loginAttempts.delete(identifier);
    lockedAccounts.delete(identifier);
}

/**
 * Get current attempt count
 */
function getAttemptCount(identifier) {
    if (!loginAttempts.has(identifier)) {
        return 0;
    }

    const now = Date.now();
    const attempts = loginAttempts.get(identifier);
    const recentAttempts = attempts.filter(timestamp => now - timestamp < ATTEMPT_WINDOW);

    return recentAttempts.length;
}

/**
 * Cleanup old entries (run periodically)
 */
function cleanup() {
    const now = Date.now();

    // Clean up expired locks
    for (const [identifier, lockUntil] of lockedAccounts.entries()) {
        if (now >= lockUntil) {
            lockedAccounts.delete(identifier);
        }
    }

    // Clean up old attempts
    for (const [identifier, attempts] of loginAttempts.entries()) {
        const recentAttempts = attempts.filter(timestamp => now - timestamp < ATTEMPT_WINDOW);
        if (recentAttempts.length === 0) {
            loginAttempts.delete(identifier);
        } else {
            loginAttempts.set(identifier, recentAttempts);
        }
    }
}

// Run cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000);

module.exports = {
    recordFailedAttempt,
    isAccountLocked,
    resetAttempts,
    getAttemptCount,
    MAX_LOGIN_ATTEMPTS,
    LOCKOUT_DURATION
};
