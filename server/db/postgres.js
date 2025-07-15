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

//Keep commented as a utility for testing
// dropAllTables();

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

// Export statements
export { statements };
