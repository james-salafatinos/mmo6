// Script to clear all active sessions for a specific user
import { deactivateSessionsByUserId } from '../db/postgres.js';

// User ID to clear sessions for
const userId = 1; // Change this to the user ID you want to clear

async function clearSessions() {
  try {
    console.log(`Clearing all sessions for user ID: ${userId}`);
    await deactivateSessionsByUserId(userId);
    console.log(`Successfully deactivated all sessions for user ID: ${userId}`);
  } catch (error) {
    console.error('Error clearing sessions:', error);
  }
}

// Run the function
clearSessions();
