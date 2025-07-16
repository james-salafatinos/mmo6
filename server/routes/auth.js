import express from 'express';
import { statements } from '../db/postgres.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
const router = express.Router();

// Session duration in milliseconds (3 seconds)
const SESSION_DURATION = 86400000;

// Generate a random session token
function generateSessionToken() {
  // Use crypto.randomUUID() which is more reliable across Node.js versions
  return crypto.randomUUID().replace(/-/g, '');
}

// User signup
router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Check if username already exists
    const existingUser = await statements.getUserByUsername.get(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    
    // Create user with hashed password
    await statements.createUser.run(username, password);
    
    // Log successful signup
    console.log(`[/server/routes/auth.js - signup] User '${username}' registered successfully`);
    
    // Return success
    res.status(201).json({ success: true, message: 'User created successfully' });
  } catch (error) {
    console.error(`[/server/routes/auth.js - signup] Error creating user '${username}':`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
router.post('/login', async (req, res) => {
    let username;
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      // Check if user exists - properly await the async function
      const user = await statements.getUserByUsername.get(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Check for existing active sessions for this user
      const existingSessions = await statements.getActiveSessionsByUserId.get(user.id);
      
      // If there's an existing active session, prevent login
      if (existingSessions.length > 0) {
        console.log(`[/server/routes/auth.js - login] Login attempt for user '${username}' rejected due to existing active session`);
        return res.status(403).json({ 
          error: 'Account already in use',
          message: 'Your account has not logged out from its last session. Please try again later'
        });
      }
      
      // Update last login time
      await statements.updateLastLogin.run(user.id);
      
      // Generate session token and expiration date
      const sessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + SESSION_DURATION);
      
      // Create session in database
      await statements.createSession.run(user.id, sessionToken, expiresAt);
      
      // Log successful login
      console.log(`[/server/routes/auth.js - login] User '${username}' logged in successfully`);
      
      // Return success with user info and session token
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          sessionToken: sessionToken,
          expiresAt: expiresAt
        }
      });
    } catch (error) {
      console.error(`[/server/routes/auth.js - login] Error logging in user '${username}':`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
// Session status check endpoint
router.get('/status', async (req, res) => {
  try {
    // Get session token from request header
    const sessionToken = req.headers['x-session-token'];
    
    if (!sessionToken) {
      return res.json({ authenticated: false, reason: 'no-token' });
    }
    
    // Check if session exists and is valid
    const session = await statements.getSessionByToken.get(sessionToken);
    
    if (!session) {
      console.log(`[/server/routes/auth.js - status] Session token ${sessionToken.substring(0, 8)}... is expired or invalid`);
      return res.json({ authenticated: false, reason: 'expired' });
    }
    
    // Calculate remaining time in seconds
    const expiresAt = new Date(session.expires_at).getTime();
    const now = Date.now();
    const remainingMs = expiresAt - now;
    
    // Update session activity (but don't extend expiration)
    await statements.updateSessionActivity.run(sessionToken);
    
    // Check if this is the only active session for this user
    // If not, we can optionally notify the client that another session exists
    // This is useful for detecting if someone else logged in with the same account
    
    return res.json({ 
      authenticated: true,
      expiresIn: Math.max(0, Math.floor(remainingMs / 1000)), // seconds remaining
      expiresAt: session.expires_at
    });
  } catch (error) {
    console.error('[/server/routes/auth.js - status] Error checking session status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User logout
router.post('/logout', async (req, res) => {
  try {
    // Get session token from request header
    const sessionToken = req.headers['x-session-token'];
    
    if (!sessionToken) {
      return res.status(400).json({ error: 'No session token provided' });
    }
    
    // Deactivate the session
    await statements.deactivateSession.run(sessionToken);
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('[/server/routes/auth.js - logout] Error logging out:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
