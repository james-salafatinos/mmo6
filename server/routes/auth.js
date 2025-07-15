import express from 'express';
import { statements } from '../db/postgres.js';
import bcrypt from 'bcrypt';
const router = express.Router();

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
      
      
      // Update last login time
      statements.updateLastLogin.run(user.id);
      
      // Log successful login
      console.log(`[/server/routes/auth.js - login] User '${username}' logged in successfully`);
      
      // Return success with user info
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username
        }
      });
    } catch (error) {
      console.error(`[/server/routes/auth.js - login] Error logging in user '${username}':`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  export default router;
