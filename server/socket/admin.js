/**
 * Admin socket event handlers
 */
import { getActiveSessions } from '../socket.js';
import { getUserById } from '../db/postgres.js';
import { ADMIN_EVENTS, PLAYER_EVENTS, CHAT_EVENTS } from '../../shared/SocketEventDefinitions.js';

/**
 * Initialize admin socket event handlers
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket instance
 */
export function initAdminSocketHandlers(io, socket) {
    console.log(`[/server/socket/admin.js - initAdminSocketHandlers] Initializing admin socket handlers for socket ${socket.id}`);
    
    // Get online players with detailed information
    socket.on(ADMIN_EVENTS.GET_ONLINE_PLAYERS, async () => {
        console.log(`[/server/socket/admin.js - admin:getOnlinePlayers] Getting online players for admin`);
        
        try {
            const activeSessions = getActiveSessions();
            const onlinePlayers = [];
            
            // Get detailed information for each online player
            for (const [userId, socketId] of activeSessions.entries()) {
                try {
                    // Get user data from database
                    const userData = await getUserById(userId);
                    
                    if (userData) {
                        onlinePlayers.push({
                            id: userId,
                            username: userData.username,
                            socketId: socketId,
                            // Add any other relevant user data here
                            lastLogin: userData.last_login,
                            level: userData.level || 1,
                            xp: userData.xp || 0
                        });
                    }
                } catch (err) {
                    console.error(`[/server/socket/admin.js] Error getting user data for ${userId}:`, err);
                }
            }
            
            // Send online players to admin
            socket.emit(ADMIN_EVENTS.ONLINE_PLAYERS, { players: onlinePlayers });
            
        } catch (err) {
            console.error('[/server/socket/admin.js - admin:getOnlinePlayers] Error:', err);
            socket.emit(ADMIN_EVENTS.ERROR, { message: 'Failed to get online players' });
        }
    });
    
    // Teleport player
    socket.on(ADMIN_EVENTS.TELEPORT_PLAYER, (data) => {
        console.log(`[/server/socket/admin.js - admin:teleportPlayer] Teleporting player ${data.playerId} to position:`, data.position);
        
        try {
            const { playerId, position } = data;
            const targetSocketId = getActiveSessions().get(playerId);
            
            if (targetSocketId) {
                // Notify the target player they are being teleported
                io.to(targetSocketId).emit(PLAYER_EVENTS.TELEPORT, {
                    position,
                    message: 'You have been teleported by an admin'
                });
                
                // Confirm to admin
                socket.emit(ADMIN_EVENTS.SUCCESS, { message: `Player ${playerId} teleported successfully` });
            } else {
                socket.emit('admin:error', { message: 'Player not found or offline' });
            }
        } catch (err) {
            console.error('[/server/socket/admin.js - admin:teleportPlayer] Error:', err);
            socket.emit(ADMIN_EVENTS.ERROR, { message: 'Failed to teleport player' });
        }
    });
    
    // Award XP to player
    socket.on(ADMIN_EVENTS.AWARD_XP, (data) => {
        console.log(`[/server/socket/admin.js - admin:awardXP] Awarding ${data.amount} XP to player ${data.playerId}`);
        
        try {
            const { playerId, amount } = data;
            const targetSocketId = getActiveSessions().get(playerId);
            
            if (targetSocketId) {
                // Notify the target player they received XP
                io.to(targetSocketId).emit(PLAYER_EVENTS.XP_AWARDED, {
                    amount,
                    message: `You have been awarded ${amount} XP by an admin`
                });
                
                // Confirm to admin
                socket.emit(ADMIN_EVENTS.SUCCESS, { message: `Awarded ${amount} XP to player ${playerId}` });
            } else {
                socket.emit('admin:error', { message: 'Player not found or offline' });
            }
        } catch (err) {
            console.error('[/server/socket/admin.js - admin:awardXP] Error:', err);
            socket.emit(ADMIN_EVENTS.ERROR, { message: 'Failed to award XP' });
        }
    });
    
    // Spawn item
    socket.on(ADMIN_EVENTS.SPAWN_ITEM, (data) => {
        console.log(`[/server/socket/admin.js - admin:spawnItem] Spawning item ${data.itemType} x${data.quantity}`);
        
        try {
            // Implementation would depend on game mechanics
            // For now, just notify admin of success
            socket.emit(ADMIN_EVENTS.SUCCESS, { 
                message: `Spawned ${data.quantity} x ${data.itemType}`
            });
        } catch (err) {
            console.error('[/server/socket/admin.js - admin:spawnItem] Error:', err);
            socket.emit(ADMIN_EVENTS.ERROR, { message: 'Failed to spawn item' });
        }
    });
    
    // Admin yell (broadcast message to all players)
    socket.on(ADMIN_EVENTS.YELL, (data) => {
        console.log(`[/server/socket/admin.js - admin:yell] Broadcasting admin message: ${data.message}`);
        
        try {
            // Broadcast to all connected clients
            io.emit(CHAT_EVENTS.ADMIN_MESSAGE, {
                message: data.message,
                sender: 'ADMIN'
            });
            
            // Confirm to admin
            socket.emit(ADMIN_EVENTS.SUCCESS, { message: 'Message broadcast successfully' });
        } catch (err) {
            console.error('[/server/socket/admin.js - admin:yell] Error:', err);
            socket.emit(ADMIN_EVENTS.ERROR, { message: 'Failed to broadcast message' });
        }
    });
}

