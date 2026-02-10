/**
 * Socket.IO Client Configuration
 * Manages WebSocket connection for real-time features
 */

import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  /**
   * Connect to Socket.IO server
   * @param {string} token - JWT token for authentication
   */
  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.setupEventListeners();
  }

  /**
   * Setup default event listeners
   */
  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('🔌 Connected to Socket.IO server');
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from Socket.IO server:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
    });
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Join user's private room
   * @param {string} userId - User ID
   */
  joinUserRoom(userId) {
    if (this.socket) {
      this.socket.emit('user:join', userId);
    }
  }

  /**
   * Join a project room
   * @param {string} projectId - Project ID
   */
  joinProjectRoom(projectId) {
    if (this.socket) {
      this.socket.emit('project:join', projectId);
    }
  }

  /**
   * Leave a project room
   * @param {string} projectId - Project ID
   */
  leaveProjectRoom(projectId) {
    if (this.socket) {
      this.socket.emit('project:leave', projectId);
    }
  }

  /**
   * Join a chat room
   * @param {string} chatId - Chat ID
   */
  joinChatRoom(chatId) {
    if (this.socket) {
      this.socket.emit('chat:join', chatId);
    }
  }

  /**
   * Leave a chat room
   * @param {string} chatId - Chat ID
   */
  leaveChatRoom(chatId) {
    if (this.socket) {
      this.socket.emit('chat:leave', chatId);
    }
  }

  /**
   * Send typing indicator
   * @param {string} chatId - Chat ID
   * @param {string} userId - User ID
   * @param {boolean} isTyping - Typing status
   */
  sendTypingIndicator(chatId, userId, isTyping) {
    if (this.socket) {
      this.socket.emit('chat:typing', { chatId, userId, isTyping });
    }
  }

  /**
   * Send a message
   * @param {object} messageData - Message data
   */
  sendMessage(messageData) {
    if (this.socket) {
      this.socket.emit('message:send', messageData);
    }
  }

  /**
   * Listen for new messages
   * @param {Function} callback - Callback function
   */
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('message:new', callback);
    }
  }

  /**
   * Listen for notifications
   * @param {Function} callback - Callback function
   */
  onNotification(callback) {
    if (this.socket) {
      this.socket.on('notification:new', callback);
    }
  }

  /**
   * Listen for project updates
   * @param {Function} callback - Callback function
   */
  onProjectUpdate(callback) {
    if (this.socket) {
      this.socket.on('project:update', callback);
    }
  }

  /**
   * Listen for typing indicators
   * @param {Function} callback - Callback function
   */
  onTyping(callback) {
    if (this.socket) {
      this.socket.on('chat:typing', callback);
    }
  }

  /**
   * Generic event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected() {
    return this.connected && this.socket?.connected;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
