// filepath: /Users/navya/iCloud Drive (Archive)/Desktop/Documents/freelance/server/src/sockets/index.js
/**
 * Socket.IO Event Handlers
 * Step 5.1 - Socket.IO Setup
 * Step 5.2 - Emit Events After DB Updates
 * Step 9 - Enhanced with structured logging
 * 
 * Background realtime state sync - no business logic, only event broadcasting
 * No UI rooms - simple global broadcast for state updates
 */

import logger from '../utils/logger.js';

/**
 * Initialize Socket.IO with connection handlers
 * Step 5.1 - Socket.IO Setup
 * @param {Server} io - Socket.IO server instance
 */
export const initializeSocket = (io) => {
  // Track connected clients
  let connectedClients = 0;

  // Connection event
  io.on('connection', (socket) => {
    connectedClients++;
    logger.logSocket('Client connected', {
      socketId: socket.id,
      totalClients: connectedClients,
      transport: socket.conn.transport.name
    });

    // Send connection confirmation
    socket.emit('connected', {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
      message: 'Connected to Freelance Marketplace realtime server'
    });

    // Disconnect event
    socket.on('disconnect', (reason) => {
      connectedClients--;
      logger.logSocket('Client disconnected', {
        socketId: socket.id,
        reason,
        totalClients: connectedClients
      });
    });

    // Ping/pong for connection health check
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error('Socket error', {
        socketId: socket.id,
        error: error.message,
        stack: error.stack
      });
    });
  });

  // Store io instance for use in services
  global.io = io;
  
  console.log('✅ Socket.IO initialized - Background state sync ready');
};

/**
 * Emit project created event
 * Step 5.2 - Emit after DB success
 * @param {Object} project - Created project
 */
export const emitProjectCreated = (project) => {
  if (!global.io) return;
  
  global.io.emit('PROJECT_CREATED', {
    event: 'PROJECT_CREATED',
    data: project,
    timestamp: new Date().toISOString()
  });
  
  console.log(`📡 Emitted: PROJECT_CREATED | Project: ${project._id}`);
};

/**
 * Emit project updated event
 * Step 5.2 - Emit after DB success
 * @param {Object} project - Updated project
 */
export const emitProjectUpdated = (project) => {
  if (!global.io) return;
  
  global.io.emit('PROJECT_UPDATED', {
    event: 'PROJECT_UPDATED',
    data: project,
    timestamp: new Date().toISOString()
  });
  
  console.log(`📡 Emitted: PROJECT_UPDATED | Project: ${project._id}`);
};

/**
 * Emit project assigned event
 * Step 5.2 - Emit after DB success
 * @param {Object} data - Assignment data (project + accepted bid)
 */
export const emitProjectAssigned = (data) => {
  if (!global.io) return;
  
  global.io.emit('PROJECT_ASSIGNED', {
    event: 'PROJECT_ASSIGNED',
    data: {
      project: data.project,
      acceptedBid: data.acceptedBid
    },
    timestamp: new Date().toISOString()
  });
  
  console.log(`📡 Emitted: PROJECT_ASSIGNED | Project: ${data.project._id} | Freelancer: ${data.acceptedBid.freelancerId}`);
};

/**
 * Emit bid submitted event
 * @param {Object} bid - Submitted bid
 */
export const emitBidSubmitted = (bid) => {
  if (!global.io) return;
  
  global.io.emit('BID_SUBMITTED', {
    event: 'BID_SUBMITTED',
    data: bid,
    timestamp: new Date().toISOString()
  });
  
  console.log(`📡 Emitted: BID_SUBMITTED | Bid: ${bid._id} | Project: ${bid.projectId}`);
};

/**
 * Emit bid updated event
 * @param {Object} bid - Updated bid
 */
export const emitBidUpdated = (bid) => {
  if (!global.io) return;
  
  global.io.emit('BID_UPDATED', {
    event: 'BID_UPDATED',
    data: bid,
    timestamp: new Date().toISOString()
  });
  
  console.log(`📡 Emitted: BID_UPDATED | Bid: ${bid._id}`);
};

/**
 * Emit bid withdrawn event
 * @param {String} bidId - Withdrawn bid ID
 * @param {String} projectId - Project ID
 */
export const emitBidWithdrawn = (bidId, projectId) => {
  if (!global.io) return;
  
  global.io.emit('BID_WITHDRAWN', {
    event: 'BID_WITHDRAWN',
    data: {
      bidId,
      projectId
    },
    timestamp: new Date().toISOString()
  });
  
  console.log(`📡 Emitted: BID_WITHDRAWN | Bid: ${bidId}`);
};

/**
 * Emit project closed event
 * @param {Object} project - Closed project
 */
export const emitProjectClosed = (project) => {
  if (!global.io) return;
  
  global.io.emit('PROJECT_CLOSED', {
    event: 'PROJECT_CLOSED',
    data: project,
    timestamp: new Date().toISOString()
  });
  
  console.log(`📡 Emitted: PROJECT_CLOSED | Project: ${project._id}`);
};

export default {
  initializeSocket,
  emitProjectCreated,
  emitProjectUpdated,
  emitProjectAssigned,
  emitBidSubmitted,
  emitBidUpdated,
  emitBidWithdrawn,
  emitProjectClosed
};
