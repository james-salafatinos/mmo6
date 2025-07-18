/**
 * Socket Event Definitions
 * Centralized location for all socket event names to avoid magic strings
 */

// Authentication Events
export const AUTH_EVENTS = {
    AUTHENTICATE: 'authenticate',
    AUTHENTICATED: 'authenticated',
    AUTHENTICATION_ERROR: 'authentication_error',
    DUPLICATE_SESSION: 'duplicate_session',
    NEW_LOGIN_ATTEMPT: 'new_login_attempt',
    LOGOUT: 'logout'
};

// Admin Events
export const ADMIN_EVENTS = {
    GET_ONLINE_PLAYERS: 'admin:getOnlinePlayers',
    ONLINE_PLAYERS: 'admin:onlinePlayers',
    TELEPORT_PLAYER: 'admin:teleportPlayer',
    AWARD_XP: 'admin:awardXP',
    SPAWN_ITEM: 'admin:spawnItem',
    YELL: 'admin:yell',
    SUCCESS: 'admin:success',
    ERROR: 'admin:error',
    // Client-side admin events (different naming convention found)
    TELEPORT: 'admin:teleport',
    AWARD_XP_ALT: 'admin:awardXp'
};

// Player Events
export const PLAYER_EVENTS = {
    TELEPORT: 'player:teleport',
    XP_AWARDED: 'player:xpAwarded'
};

// Chat Events
export const CHAT_EVENTS = {
    ADMIN_MESSAGE: 'chat:adminMessage'
};

// System Events
export const SYSTEM_EVENTS = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    USER_COUNT_UPDATE: 'user_count_update'
};

// Export all events as a single object for convenience
export const SOCKET_EVENTS = {
    ...AUTH_EVENTS,
    ...ADMIN_EVENTS,
    ...PLAYER_EVENTS,
    ...CHAT_EVENTS,
    ...SYSTEM_EVENTS
};
