const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get user bookings
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 10,
      status
    } = req.query;

    const skip = (page - 1) * limit;

    const where = { userId: req.user.id };
    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          event: {
            include: {
              venue: {
                select: {
                  name: true,
                  city: true,
                  state: true
                }
              }
            }
          },
          seat: {
            select: {
              row: true,
              number: true,
              section: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.booking.count({ where })
    ]);

    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get single booking
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        event: {
          include: {
            venue: {
              select: {
                name: true,
                address: true,
                city: true,
                state: true,
                zipCode: true
              }
            }
          }
        },
        seat: {
          select: {
            row: true,
            number: true,
            section: true,
            price: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user owns this booking or is admin
    if (booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// Create booking
router.post('/', [
  body('eventId').notEmpty(),
  body('seatId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventId, seatId } = req.body;

    // Check if event exists and is upcoming
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        venue: true
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Event is cancelled' });
    }

    if (new Date(event.date) < new Date()) {
      return res.status(400).json({ error: 'Event has already passed' });
    }

    // Check if seat exists and is available
    const seat = await prisma.seat.findUnique({
      where: { id: seatId }
    });

    if (!seat) {
      return res.status(404).json({ error: 'Seat not found' });
    }

    if (seat.status !== 'AVAILABLE') {
      return res.status(400).json({ error: 'Seat is not available' });
    }

    if (seat.venueId !== event.venueId) {
      return res.status(400).json({ error: 'Seat does not belong to event venue' });
    }

    // Check if user already has a booking for this event
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId: req.user.id,
        eventId
      }
    });

    if (existingBooking) {
      return res.status(400).json({ error: 'You already have a booking for this event' });
    }

    // Create booking and update seat status in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Reserve the seat
      await tx.seat.update({
        where: { id: seatId },
        data: { status: 'RESERVED' }
      });

      // Create the booking
      return await tx.booking.create({
        data: {
          userId: req.user.id,
          eventId,
          seatId,
          totalPrice: seat.price
        },
        include: {
          event: {
            include: {
              venue: {
                select: {
                  name: true,
                  city: true,
                  state: true
                }
              }
            }
          },
          seat: {
            select: {
              row: true,
              number: true,
              section: true,
              price: true
            }
          }
        }
      });
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Cancel booking
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        event: true,
        seat: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user owns this booking or is admin
    if (booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Booking cannot be cancelled' });
    }

    // Check if event is in the future
    if (new Date(booking.event.date) <= new Date()) {
      return res.status(400).json({ error: 'Cannot cancel booking for past events' });
    }

    // Cancel booking and free up seat in a transaction
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updated = await tx.booking.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });

      // Free up the seat
      await tx.seat.update({
        where: { id: booking.seatId },
        data: { status: 'AVAILABLE' }
      });

      return updated;
    });

    res.json({
      message: 'Booking cancelled successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Get all bookings (admin only)
router.get('/admin/all', authenticateToken, requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED']),
  query('eventId').optional().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 20,
      status,
      eventId
    } = req.query;

    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (eventId) where.eventId = eventId;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          event: {
            include: {
              venue: {
                select: {
                  name: true,
                  city: true,
                  state: true
                }
              }
            }
          },
          seat: {
            select: {
              row: true,
              number: true,
              section: true
            }
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.booking.count({ where })
    ]);

    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get admin bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

module.exports = router; 