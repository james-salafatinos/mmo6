/**
 * Admin.js - Handles admin panel functionality
 */
import { socket } from '../socket.js';

// Admin password - in a real app, this would be handled securely on the server
const ADMIN_PASSWORD = 'admin123'; // Simple hardcoded password for MVP

// DOM Elements
let adminButton;
let adminPasswordModal;
let adminPanel;
let closeAdminModalButton;
let submitAdminPasswordButton;
let adminPasswordInput;
let closeAdminPanelButton;

// Admin panel elements
let teleportPlayerSelect;
let teleportButton;
let xpPlayerSelect;
let awardXpButton;
let onlinePlayersList;
let spawnItemButton;
let yellButton;

/**
 * Initialize admin functionality
 */
export function initAdmin() {
    console.log('[/client/js/admin.js - initAdmin] Initializing admin functionality');
    
    // Get DOM elements
    adminButton = document.getElementById('admin-button');
    adminPasswordModal = document.getElementById('admin-password-modal');
    adminPanel = document.getElementById('admin-panel');
    closeAdminModalButton = document.getElementById('close-admin-modal');
    submitAdminPasswordButton = document.getElementById('submit-admin-password');
    adminPasswordInput = document.getElementById('admin-password');
    closeAdminPanelButton = document.getElementById('close-admin-panel');
    
    // Admin panel elements
    teleportPlayerSelect = document.getElementById('teleport-player');
    teleportButton = document.getElementById('teleport-button');
    xpPlayerSelect = document.getElementById('xp-player');
    awardXpButton = document.getElementById('award-xp-button');
    onlinePlayersList = document.getElementById('online-players-list');
    spawnItemButton = document.getElementById('spawn-item-button');
    yellButton = document.getElementById('yell-button');
    
    // Set up event listeners
    setupEventListeners();
}

/**
 * Set up event listeners for admin functionality
 */
function setupEventListeners() {
    // Admin button click - show password modal
    adminButton.addEventListener('click', () => {
        console.log('[/client/js/admin.js - adminButton.click] Admin button clicked');
        showAdminPasswordModal();
    });
    
    // Close admin password modal
    closeAdminModalButton.addEventListener('click', () => {
        console.log('[/client/js/admin.js - closeAdminModalButton.click] Closing admin password modal');
        hideAdminPasswordModal();
    });
    
    // Submit admin password
    submitAdminPasswordButton.addEventListener('click', () => {
        console.log('[/client/js/admin.js - submitAdminPasswordButton.click] Submitting admin password');
        validateAdminPassword();
    });
    
    // Admin password input - enter key
    adminPasswordInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            validateAdminPassword();
        }
    });
    
    // Close admin panel
    closeAdminPanelButton.addEventListener('click', () => {
        console.log('[/client/js/admin.js - closeAdminPanelButton.click] Closing admin panel');
        hideAdminPanel();
    });
    
    // Tab switching functionality
    setupTabSwitching();
    
    // Admin panel functionality
    setupAdminPanelEventListeners();
}

/**
 * Set up tab switching functionality
 */
function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.admin-tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            console.log(`[/client/js/admin.js - tabButton.click] Switching to tab: ${tabName}`);
            
            // Remove active class from all tab buttons and content
            document.querySelectorAll('.admin-tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelectorAll('.admin-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Add active class to clicked tab button and corresponding content
            button.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');

        });
    });
}

/**
 * Set up event listeners for admin panel functionality
 */
function setupAdminPanelEventListeners() {
    // Teleport button
    teleportButton.addEventListener('click', () => {
        const playerId = teleportPlayerSelect.value;
        const x = parseFloat(document.getElementById('teleport-x').value);
        const y = parseFloat(document.getElementById('teleport-y').value);
        const z = parseFloat(document.getElementById('teleport-z').value);
        
        if (playerId && !isNaN(x) && !isNaN(y) && !isNaN(z)) {
            console.log(`[/client/js/admin.js - teleportButton.click] Teleporting player ${playerId} to (${x}, ${y}, ${z})`);
            socket.emit('admin:teleport', { playerId, position: { x, y, z } });
        }
    });
    
    // Award XP button
    awardXpButton.addEventListener('click', () => {
        const playerId = xpPlayerSelect.value;
        const amount = parseInt(document.getElementById('xp-amount').value);
        
        if (playerId && !isNaN(amount)) {
            console.log(`[/client/js/admin.js - awardXpButton.click] Awarding ${amount} XP to player ${playerId}`);
            socket.emit('admin:awardXp', { playerId, amount });
        }
    });
    
    // Spawn item button
    spawnItemButton.addEventListener('click', () => {
        const itemType = document.getElementById('item-type').value;
        const quantity = parseInt(document.getElementById('item-quantity').value) || 1;
        
        if (itemType) {
            console.log(`[/client/js/admin.js - spawnItemButton.click] Spawning ${quantity} of item ${itemType}`);
            socket.emit('admin:spawnItem', { itemType, quantity });
        }
    });
    
    // Yell button
    yellButton.addEventListener('click', () => {
        const message = document.getElementById('yell-message').value;
        
        if (message) {
            console.log(`[/client/js/admin.js - yellButton.click] Yelling: ${message}`);
            socket.emit('admin:yell', { message });
        }
    });
}

/**
 * Show the admin password modal
 */
function showAdminPasswordModal() {
    adminPasswordModal.classList.add('active');
    adminPasswordInput.value = '';
    adminPasswordInput.focus();
}

/**
 * Hide the admin password modal
 */
function hideAdminPasswordModal() {
    adminPasswordModal.classList.remove('active');
}

/**
 * Validate the admin password
 */
function validateAdminPassword() {
    const password = adminPasswordInput.value;
    
    if (password === ADMIN_PASSWORD) {
        console.log('[/client/js/admin.js - validateAdminPassword] Admin password correct');
        hideAdminPasswordModal();
        showAdminPanel();
        updateOnlinePlayersList();
    } else {
        console.log('[/client/js/admin.js - validateAdminPassword] Admin password incorrect');
        alert('Incorrect admin password');
    }
}

/**
 * Show the admin panel
 */
function showAdminPanel() {
    adminPanel.classList.add('active');
    
    // Request online players data when admin panel is opened
    updateOnlinePlayersList();
}

/**
 * Hide the admin panel
 */
function hideAdminPanel() {
    adminPanel.classList.remove('active');
}

/**
 * Update the online players list in the admin panel
 */
function updateOnlinePlayersList() {
    console.log('[/client/js/admin.js - updateOnlinePlayersList] Requesting online players');
    socket.emit('admin:getOnlinePlayers');
}

/**
 * Handle online players data from the server
 * @param {Object} data - Data containing array of players
 */
export function handleOnlinePlayers(data) {
    const players = data.players;
    console.log('[/client/js/admin.js - handleOnlinePlayers] Received online players:', players);
    
    // Clear existing options
    teleportPlayerSelect.innerHTML = '<option value="">Select Player</option>';
    xpPlayerSelect.innerHTML = '<option value="">Select Player</option>';
    
    // Clear online players list
    onlinePlayersList.innerHTML = '';
    
    // Display total count
    const countElement = document.createElement('div');
    countElement.classList.add('admin-players-count');
    countElement.textContent = `Total online players: ${players.length}`;
    onlinePlayersList.appendChild(countElement);
    
    // Add players to the lists
    players.forEach(player => {
        // Add to teleport select
        const teleportOption = document.createElement('option');
        teleportOption.value = player.id;
        teleportOption.textContent = player.username;
        teleportPlayerSelect.appendChild(teleportOption);
        
        // Add to XP select
        const xpOption = document.createElement('option');
        xpOption.value = player.id;
        xpOption.textContent = player.username;
        xpPlayerSelect.appendChild(xpOption);
        
        // Format last login time if available
        let lastLoginDisplay = 'N/A';
        if (player.lastLogin) {
            const lastLogin = new Date(player.lastLogin);
            lastLoginDisplay = lastLogin.toLocaleString();
        }
        
        // Add to online players list with enhanced details
        const playerElement = document.createElement('div');
        playerElement.classList.add('admin-player-item');
        playerElement.innerHTML = `
            <div class="admin-player-header">
                <span class="admin-player-name">${player.username}</span>
                <span class="admin-player-status online">Online</span>
            </div>
            <div class="admin-player-details">
                <div class="admin-player-detail"><strong>ID:</strong> ${player.id}</div>
                <div class="admin-player-detail"><strong>Level:</strong> ${player.level || 1}</div>
                <div class="admin-player-detail"><strong>XP:</strong> ${player.xp || 0}</div>
                <div class="admin-player-detail"><strong>Last Login:</strong> ${lastLoginDisplay}</div>
            </div>
            <div class="admin-player-actions">
                <button class="admin-btn admin-btn-sm" onclick="teleportToPlayer('${player.id}')">Teleport To</button>
                <button class="admin-btn admin-btn-sm" onclick="awardXpToPlayer('${player.id}')">Award XP</button>
            </div>
        `;
        onlinePlayersList.appendChild(playerElement);
    });
    
    // Show message if no players online
    if (players.length === 0) {
        const noPlayersElement = document.createElement('div');
        noPlayersElement.classList.add('admin-no-players');
        noPlayersElement.textContent = 'No players currently online';
        onlinePlayersList.appendChild(noPlayersElement);
    }
}

/**
 * Teleport to a specific player (helper function for player card buttons)
 * @param {string} playerId - ID of the player to teleport to
 */
function teleportToPlayer(playerId) {
    console.log(`[/client/js/admin.js - teleportToPlayer] Teleporting to player ${playerId}`);
    
    // Set the teleport player select value
    teleportPlayerSelect.value = playerId;
    
    // Switch to the teleport tab
    document.querySelector('.admin-tab-btn[data-tab="teleport"]').click();
}

/**
 * Award XP to a specific player (helper function for player card buttons)
 * @param {string} playerId - ID of the player to award XP to
 */
function awardXpToPlayer(playerId) {
    console.log(`[/client/js/admin.js - awardXpToPlayer] Award XP to player ${playerId}`);
    
    // Set the XP player select value
    xpPlayerSelect.value = playerId;
    
    // Switch to the XP tab
    document.querySelector('.admin-tab-btn[data-tab="xp"]').click();
}

// Set up socket event listeners for admin functionality
socket.on('admin:onlinePlayers', handleOnlinePlayers);
socket.on('admin:success', (data) => {
    console.log(`[/client/js/admin.js - admin:success] ${data.message}`);
    alert(`Success: ${data.message}`);
});

socket.on('admin:error', (data) => {
    console.error(`[/client/js/admin.js - admin:error] ${data.message}`);
    alert(`Error: ${data.message}`);
});

// Make helper functions available globally for the onclick handlers
window.teleportToPlayer = teleportToPlayer;
window.awardXpToPlayer = awardXpToPlayer;
