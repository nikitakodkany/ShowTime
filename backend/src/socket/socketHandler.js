const { prisma } = require('../config/database');

// Store active seat holds
const activeHolds = new Map(); // seatId -> { userId, timestamp, socketId }

// Clean up expired holds every 5 minutes
setInterval(() => {
  const now = Date.now();
  const holdTimeout = 5 * 60 * 1000; // 5 minutes

  for (const [seatId, hold] of activeHolds.entries()) {
    if (now - hold.timestamp > holdTimeout) {
      activeHolds.delete(seatId);
      console.log(`Seat hold expired for seat ${seatId}`);
    }
  }
}, 5 * 60 * 1000);

const handleSocketConnection = (socket, io) => {
  console.log(`User connected: ${socket.id}`);

  // Join event room for seat updates
  socket.on('join-event', async (eventId) => {
    try {
      socket.join(`event-${eventId}`);
      console.log(`Socket ${socket.id} joined event ${eventId}`);
    } catch (error) {
      console.error('Error joining event room:', error);
    }
  });

  // Leave event room
  socket.on('leave-event', (eventId) => {
    socket.leave(`event-${eventId}`);
    console.log(`Socket ${socket.id} left event ${eventId}`);
  });

  // Hold seat
  socket.on('hold-seat', async (data) => {
    try {
      const { seatId, eventId, userId } = data;

      // Check if seat is already held by someone else
      const existingHold = activeHolds.get(seatId);
      if (existingHold && existingHold.userId !== userId) {
        socket.emit('seat-hold-failed', {
          seatId,
          error: 'Seat is already being held by another user'
        });
        return;
      }

      // Check if seat is available in database
      const seat = await prisma.seat.findUnique({
        where: { id: seatId }
      });

      if (!seat || seat.status !== 'AVAILABLE') {
        socket.emit('seat-hold-failed', {
          seatId,
          error: 'Seat is not available'
        });
        return;
      }

      // Create or update hold
      activeHolds.set(seatId, {
        userId,
        timestamp: Date.now(),
        socketId: socket.id
      });

      // Notify other users in the event room
      socket.to(`event-${eventId}`).emit('seat-held', {
        seatId,
        userId
      });

      socket.emit('seat-hold-success', {
        seatId,
        message: 'Seat held successfully'
      });

      console.log(`Seat ${seatId} held by user ${userId}`);
    } catch (error) {
      console.error('Error holding seat:', error);
      socket.emit('seat-hold-failed', {
        seatId: data?.seatId,
        error: 'Failed to hold seat'
      });
    }
  });

  // Release seat hold
  socket.on('release-seat', async (data) => {
    try {
      const { seatId, eventId, userId } = data;

      const hold = activeHolds.get(seatId);
      if (hold && hold.userId === userId) {
        activeHolds.delete(seatId);

        // Notify other users in the event room
        socket.to(`event-${eventId}`).emit('seat-released', {
          seatId
        });

        socket.emit('seat-release-success', {
          seatId,
          message: 'Seat released successfully'
        });

        console.log(`Seat ${seatId} released by user ${userId}`);
      }
    } catch (error) {
      console.error('Error releasing seat:', error);
    }
  });

  // Confirm seat booking
  socket.on('confirm-booking', async (data) => {
    try {
      const { seatId, eventId, userId } = data;

      // Remove hold
      const hold = activeHolds.get(seatId);
      if (hold && hold.userId === userId) {
        activeHolds.delete(seatId);
      }

      // Notify other users in the event room
      socket.to(`event-${eventId}`).emit('seat-booked', {
        seatId,
        userId
      });

      socket.emit('booking-confirmed', {
        seatId,
        message: 'Booking confirmed'
      });

      console.log(`Seat ${seatId} booked by user ${userId}`);
    } catch (error) {
      console.error('Error confirming booking:', error);
    }
  });

  // Get seat availability for an event
  socket.on('get-seat-availability', async (eventId) => {
    try {
      const seats = await prisma.seat.findMany({
        where: {
          venue: {
            events: {
              some: { id: eventId }
            }
          }
        },
        select: {
          id: true,
          row: true,
          number: true,
          section: true,
          price: true,
          status: true
        }
      });

      // Add hold information
      const seatsWithHolds = seats.map(seat => {
        const hold = activeHolds.get(seat.id);
        return {
          ...seat,
          isHeld: !!hold,
          heldBy: hold ? hold.userId : null
        };
      });

      socket.emit('seat-availability', {
        eventId,
        seats: seatsWithHolds
      });
    } catch (error) {
      console.error('Error getting seat availability:', error);
      socket.emit('seat-availability-error', {
        error: 'Failed to get seat availability'
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    // Release all holds by this socket
    for (const [seatId, hold] of activeHolds.entries()) {
      if (hold.socketId === socket.id) {
        activeHolds.delete(seatId);
        console.log(`Released seat ${seatId} due to disconnect`);
      }
    }
  });
};

// Function to notify all clients about seat status changes
const notifySeatStatusChange = (eventId, seatId, status) => {
  // This would be called from API routes when seat status changes
  // For now, we'll implement this when needed
};

module.exports = {
  handleSocketConnection,
  notifySeatStatusChange,
  activeHolds
}; 