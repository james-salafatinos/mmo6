// server/routes/index.js
// Combine all routes

import express from 'express';
import authRoutes from './auth.js';

// Create a function that returns a router with all routes
export default function createRouter() {
  const router = express.Router();

  // Mount auth routes
  router.use('/auth', authRoutes);



  return router;
}
