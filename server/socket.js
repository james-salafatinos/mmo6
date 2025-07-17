// Socket.IO server implementation
import { Server } from 'socket.io';
import { deactivateSessionsByUserId } from './db/postgres.js';
import { initAdminSocketHandlers } from './socket/admin.js';

// Active user sessions map (userId -> socketId)
const activeSessions = new Map();

// Store the Socket.IO server instance for external access
let ioInstance;

/**
 * Initialize Socket.IO server
 * @param {Object} httpServer - HTTP server instance
 * @returns {Object} Socket.IO server instance
 */
export function initSocketIO(httpServer) {
  console.log('[/server/socket.js - initSocketIO] Initializing Socket.IO server');
  const io = new Server(httpServer);
  
  // Store the io instance for external access
  ioInstance = io;
  
  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log(`[/server/socket.js - socket.connection] New socket connection: ${socket.id}`);
    
    // Handle authentication
    socket.on('authenticate', (data) => {
      const { userId, sessionToken } = data;
      
      if (!userId || !sessionToken) {
        socket.emit('authentication_error', { message: 'Invalid authentication data' });
        return;
      }
      
      console.log(`[/server/socket.js - socket.authenticate] User ${userId} authenticating`);
      
      // Check if this user already has an active socket connection
      if (activeSessions.has(userId)) {
        const existingSocketId = activeSessions.get(userId);
        
        // If it's the same socket, just update the mapping
        if (existingSocketId === socket.id) {
          console.log(`[/server/socket.js - socket.authenticate] User ${userId} reconnected with same socket`);
          return;
        }
        
        console.log(`[/server/socket.js - socket.authenticate] User ${userId} already has an active session`);
        
        // Notify the new connection that it's a duplicate
        socket.emit('duplicate_session', { 
          message: 'Your account is already logged in on another tab or browser'
        });
        
        // Optionally, we could also notify the existing connection
        const existingSocket = io.sockets.sockets.get(existingSocketId);
        if (existingSocket) {
          existingSocket.emit('new_login_attempt', { 
            message: 'Someone tried to log in to your account from another tab or browser'
          });
        }
      } else {
        // Store the new session
        activeSessions.set(userId, socket.id);
        socket.userId = userId; // Store userId on the socket for later reference
        
        console.log(`[/server/socket.js - socket.authenticate] User ${userId} authenticated successfully`);
        socket.emit('authenticated', { success: true });
        
        // Initialize admin socket handlers
        initAdminSocketHandlers(io, socket);
        
        // Broadcast updated user count to all connected clients
        broadcastUserCount(io);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', async () => {
      if (socket.userId) {
        console.log(`[/server/socket.js - socket.disconnect] User ${socket.userId} disconnected`);
        
        // Only remove if this is the current socket for this user
        if (activeSessions.get(socket.userId) === socket.id) {
          activeSessions.delete(socket.userId);
          
          // Deactivate all sessions for this user in the database
          try {
            await deactivateSessionsByUserId(socket.userId);
            console.log(`[/server/socket.js - socket.disconnect] Deactivated all sessions for user ${socket.userId}`);
          } catch (error) {
            console.error(`[/server/socket.js - socket.disconnect] Error deactivating sessions for user ${socket.userId}:`, error);
          }
          
          // Broadcast updated user count to all connected clients
          broadcastUserCount(io);
        }
      }
    });
    
    // Handle logout
    socket.on('logout', () => {
      if (socket.userId) {
        console.log(`[/server/socket.js - socket.logout] User ${socket.userId} logged out`);
        
        // Remove from active sessions
        if (activeSessions.get(socket.userId) === socket.id) {
          activeSessions.delete(socket.userId);
          
          // Broadcast updated user count to all connected clients
          broadcastUserCount(io);
        }
      }
    });
  });
  
  return io;
}

/**
 * Get active sessions map
 * @returns {Map} Map of active sessions (userId -> socketId)
 */
export function getActiveSessions() {
  return activeSessions;
}

/**
 * Get number of online users
 * @returns {number} Number of online users
 */
export function getOnlineUserCount() {
  return activeSessions.size;
}

/**
 * Broadcast the current user count to all connected clients
 * @param {Object} io - Socket.IO server instance
 */
function broadcastUserCount(io) {
  const userCount = activeSessions.size;
  console.log(`[/server/socket.js - broadcastUserCount] Broadcasting user count: ${userCount}`);
  io.emit('user_count_update', { count: userCount });
}

/**
 * Manually broadcast the current user count
 * Can be called from external modules
 */
export function updateUserCount() {
  if (ioInstance) {
    broadcastUserCount(ioInstance);
  }
}
