import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
dotenv.config();

const { Pool } = pg;

// Connection configuration
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'mmo6',
    password: process.env.DB_PASSWORD,
    port: 5432,
});


/**
 * Creates database tables if they don't exist
 */
export async function createTables() {
    const client = await pool.connect();
    try {
        // Start a transaction
        await client.query('BEGIN');

        // Create users table
        await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP WITH TIME ZONE
        )
      `);
        
        // Create sessions table
        await client.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          session_token VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT TRUE
        )
      `);


        // Commit the transaction
        await client.query('COMMIT');
        console.log('[/server/db/postgres.js - createTables] Database tables (if not existed) created successfully');
    } catch (err) {
        // Rollback in case of error
        await client.query('ROLLBACK');
        console.error('[/server/db/postgres.js - createTables] Error creating tables:', err);
        throw err;
    } finally {
        client.release();
    }
}

export async function dropAllTables() {
    const client = await pool.connect();
    try {
        // Start a transaction
        await client.query('BEGIN');

        // Drop tables in reverse order of creation to handle dependencies
        await client.query('DROP TABLE IF EXISTS sessions CASCADE');
        await client.query('DROP TABLE IF EXISTS users CASCADE');

        // Commit the transaction
        await client.query('COMMIT');
        console.log('[/server/db/postgres.js - dropAllTables] All tables dropped successfully');
    } catch (err) {
        // Rollback in case of error
        await client.query('ROLLBACK');
        console.error('[/server/db/postgres.js - dropAllTables] Error dropping tables:', err);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Get user by username
 * @param {string} username - Username to search for
 * @returns {Promise<Object|null>} - User object or null if not found
 */
export async function getUserByUsername(username) {
    const client = await pool.connect();
    try {
        const query = {
            text: 'SELECT id, username, password_hash as password, created_at, last_login FROM users WHERE username = $1',
            values: [username]
        };
        
        const result = await client.query(query);
        return result.rows[0] || null;
    } catch (err) {
        console.error('[/server/db/postgres.js - getUserByUsername] Error:', err);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Get user by ID
 * @param {string|number} userId - User ID to search for
 * @returns {Promise<Object|null>} - User object or null if not found
 */
export async function getUserById(userId) {
    const client = await pool.connect();
    try {
        const query = {
            text: 'SELECT id, username, password_hash as password, created_at, last_login FROM users WHERE id = $1',
            values: [userId]
        };
        
        const result = await client.query(query);

        return result.rows[0] || null;
    } catch (err) {
        console.error('[/server/db/postgres.js - getUserById] Error:', err);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Update user's last login time
 * @param {number} userId - User ID to update
 * @returns {Promise<boolean>} - Success status
 */
export async function updateLastLogin(userId) {
    const client = await pool.connect();
    try {
        const query = {
            text: 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            values: [userId]
        };
        
        await client.query(query);
        return true;
    } catch (err) {
        console.error('[/server/db/postgres.js - updateLastLogin] Error:', err);
        throw err;
    } finally {
        client.release();
    }
}

// Prepared statements object to store all database queries
const statements = {};
/**
 * Create a new user
 * @param {string} username - Username for new user
 * @param {string} password - Password for new user (will be hashed)
 * @returns {Promise<Object>} - Created user object
 */
export async function createUser(username, password) {
    const client = await pool.connect();
    try {
        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        const query = {
            text: 'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
            values: [username, passwordHash]
        };
        
        const result = await client.query(query);
        return result.rows[0];
    } catch (err) {
        console.error('[/server/db/postgres.js - createUser] Error:', err);
        throw err;
    } finally {
        client.release();
    }
}

// Initialize prepared statements object for compatibility with the auth route
statements.getUserByUsername = { get: getUserByUsername };
statements.updateLastLogin = { run: updateLastLogin };
statements.createUser = { run: createUser };

/**
 * Create a new session for a user
 * @param {number} userId - User ID to create session for
 * @param {string} sessionToken - Unique session token
 * @param {Date} expiresAt - Expiration date for the session
 * @returns {Promise<Object>} - Created session object
 */
export async function createSession(userId, sessionToken, expiresAt) {
    const client = await pool.connect();
    try {
        const query = {
            text: 'INSERT INTO sessions (user_id, session_token, expires_at) VALUES ($1, $2, $3) RETURNING id, user_id, session_token, created_at, expires_at',
            values: [userId, sessionToken, expiresAt]
        };
        
        const result = await client.query(query);
        return result.rows[0];
    } catch (err) {
        console.error('[/server/db/postgres.js - createSession] Error:', err);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Get session by token
 * @param {string} sessionToken - Session token to search for
 * @returns {Promise<Object|null>} - Session object or null if not found
 */
export async function getSessionByToken(sessionToken) {
    const client = await pool.connect();
    try {
        // Strictly enforce the expiration time without considering last_active
        const query = {
            text: 'SELECT * FROM sessions WHERE session_token = $1 AND is_active = TRUE AND expires_at > NOW()',
            values: [sessionToken]
        };
        
        const result = await client.query(query);
        return result.rows[0] || null;
    } catch (err) {
        console.error('[/server/db/postgres.js - getSessionByToken] Error:', err);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Update session last active time
 * @param {string} sessionToken - Session token to update
 * @returns {Promise<boolean>} - Success status
 */
export async function updateSessionActivity(sessionToken) {
    const client = await pool.connect();
    try {
        const query = {
            text: 'UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE session_token = $1 AND is_active = TRUE',
            values: [sessionToken]
        };
        
        await client.query(query);
        return true;
    } catch (err) {
        console.error('[/server/db/postgres.js - updateSessionActivity] Error:', err);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Deactivate a session
 * @param {string} sessionToken - Session token to deactivate
 * @returns {Promise<boolean>} - Success status
 */
export async function deactivateSession(sessionToken) {
    const client = await pool.connect();
    try {
        const query = {
            text: 'UPDATE sessions SET is_active = FALSE WHERE session_token = $1',
            values: [sessionToken]
        };
        
        await client.query(query);
        return true;
    } catch (err) {
        console.error('[/server/db/postgres.js - deactivateSession] Error:', err);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Deactivate all sessions for a user except the current one
 * @param {number} userId - User ID to deactivate sessions for
 * @param {string} currentSessionToken - Current session token to keep active
 * @returns {Promise<boolean>} - Success status
 */
export async function deactivateOtherSessions(userId, currentSessionToken) {
    const client = await pool.connect();
    try {
        const query = {
            text: 'UPDATE sessions SET is_active = FALSE WHERE user_id = $1 AND session_token != $2',
            values: [userId, currentSessionToken]
        };
        
        await client.query(query);
        return true;
    } catch (err) {
        console.error('[/server/db/postgres.js - deactivateOtherSessions] Error:', err);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Check if a user has any active sessions
 * @param {number} userId - User ID to check for active sessions
 * @returns {Promise<Array>} - Array of active sessions
 */
export async function getActiveSessionsByUserId(userId) {
    const client = await pool.connect();
    try {
        const query = {
            text: 'SELECT * FROM sessions WHERE user_id = $1 AND is_active = TRUE AND expires_at > NOW()',
            values: [userId]
        };
        
        const result = await client.query(query);
        return result.rows;
    } catch (err) {
        console.error('[/server/db/postgres.js - getActiveSessionsByUserId] Error:', err);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Deactivate all sessions for a user
 * @param {number} userId - User ID to deactivate sessions for
 * @returns {Promise<boolean>} - Success status
 */
export async function deactivateSessionsByUserId(userId) {
    const client = await pool.connect();
    try {
        console.log(`[/server/db/postgres.js - deactivateSessionsByUserId] Deactivating all sessions for user ${userId}`);
        const query = {
            text: 'UPDATE sessions SET is_active = FALSE WHERE user_id = $1',
            values: [userId]
        };
        
        await client.query(query);
        return true;
    } catch (err) {
        console.error('[/server/db/postgres.js - deactivateSessionsByUserId] Error:', err);
        throw err;
    } finally {
        client.release();
    }
}

// Add session management to statements object
statements.createSession = { run: createSession };
statements.getSessionByToken = { get: getSessionByToken };
statements.updateSessionActivity = { run: updateSessionActivity };
statements.deactivateSession = { run: deactivateSession };
statements.deactivateOtherSessions = { run: deactivateOtherSessions };
statements.getActiveSessionsByUserId = { get: getActiveSessionsByUserId };

// Export statements
export { statements };
