const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all venues (public)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 10,
      search
    } = req.query;

    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [venues, total] = await Promise.all([
      prisma.venue.findMany({
        where,
        include: {
          _count: {
            select: {
              events: true,
              seats: true
            }
          }
        },
        orderBy: { name: 'asc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.venue.count({ where })
    ]);

    res.json({
      venues,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get venues error:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// Get single venue (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        events: {
          where: {
            status: { not: 'CANCELLED' },
            date: { gte: new Date() }
          },
          orderBy: { date: 'asc' },
          take: 5
        },
        _count: {
          select: {
            events: true,
            seats: true
          }
        }
      }
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    res.json({ venue });
  } catch (error) {
    console.error('Get venue error:', error);
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
});

// Create venue (admin only)
router.post('/', authenticateToken, requireAdmin, [
  body('name').trim().notEmpty(),
  body('address').trim().notEmpty(),
  body('city').trim().notEmpty(),
  body('state').trim().notEmpty(),
  body('zipCode').trim().notEmpty(),
  body('country').trim().notEmpty(),
  body('capacity').isInt({ min: 1 }),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      address,
      city,
      state,
      zipCode,
      country,
      capacity,
      description,
      image
    } = req.body;

    const venue = await prisma.venue.create({
      data: {
        name,
        address,
        city,
        state,
        zipCode,
        country,
        capacity: parseInt(capacity),
        description,
        image
      }
    });

    res.status(201).json({
      message: 'Venue created successfully',
      venue
    });
  } catch (error) {
    console.error('Create venue error:', error);
    res.status(500).json({ error: 'Failed to create venue' });
  }
});

// Update venue (admin only)
router.put('/:id', authenticateToken, requireAdmin, [
  body('name').optional().trim().notEmpty(),
  body('address').optional().trim().notEmpty(),
  body('city').optional().trim().notEmpty(),
  body('state').optional().trim().notEmpty(),
  body('zipCode').optional().trim().notEmpty(),
  body('country').optional().trim().notEmpty(),
  body('capacity').optional().isInt({ min: 1 }),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = { ...req.body };

    // Convert numeric fields
    if (updateData.capacity) {
      updateData.capacity = parseInt(updateData.capacity);
    }

    const venue = await prisma.venue.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Venue updated successfully',
      venue
    });
  } catch (error) {
    console.error('Update venue error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Venue not found' });
    }
    res.status(500).json({ error: 'Failed to update venue' });
  }
});

// Delete venue (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if venue has events
    const eventsCount = await prisma.event.count({
      where: { venueId: id }
    });

    if (eventsCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete venue with existing events' 
      });
    }

    await prisma.venue.delete({
      where: { id }
    });

    res.json({ message: 'Venue deleted successfully' });
  } catch (error) {
    console.error('Delete venue error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Venue not found' });
    }
    res.status(500).json({ error: 'Failed to delete venue' });
  }
});

// Get venue seats (admin only)
router.get('/:id/seats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const seats = await prisma.seat.findMany({
      where: { venueId: id },
      orderBy: [
        { section: 'asc' },
        { row: 'asc' },
        { number: 'asc' }
      ]
    });

    res.json({ seats });
  } catch (error) {
    console.error('Get venue seats error:', error);
    res.status(500).json({ error: 'Failed to fetch venue seats' });
  }
});

// Create venue seats (admin only)
router.post('/:id/seats', authenticateToken, requireAdmin, [
  body('seats').isArray({ min: 1 }),
  body('seats.*.row').notEmpty(),
  body('seats.*.number').isInt({ min: 1 }),
  body('seats.*.section').notEmpty(),
  body('seats.*.price').isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { seats } = req.body;

    // Check if venue exists
    const venue = await prisma.venue.findUnique({
      where: { id }
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Create seats
    const createdSeats = await prisma.seat.createMany({
      data: seats.map(seat => ({
        ...seat,
        venueId: id,
        price: parseFloat(seat.price)
      }))
    });

    res.status(201).json({
      message: `${createdSeats.count} seats created successfully`,
      count: createdSeats.count
    });
  } catch (error) {
    console.error('Create venue seats error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Some seats already exist with the same row, number, and section' 
      });
    }
    res.status(500).json({ error: 'Failed to create seats' });
  }
});

// Update seat (admin only)
router.put('/seats/:seatId', authenticateToken, requireAdmin, [
  body('price').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['AVAILABLE', 'RESERVED', 'SOLD', 'MAINTENANCE'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { seatId } = req.params;
    const updateData = { ...req.body };

    if (updateData.price) {
      updateData.price = parseFloat(updateData.price);
    }

    const seat = await prisma.seat.update({
      where: { id: seatId },
      data: updateData
    });

    res.json({
      message: 'Seat updated successfully',
      seat
    });
  } catch (error) {
    console.error('Update seat error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Seat not found' });
    }
    res.status(500).json({ error: 'Failed to update seat' });
  }
});

module.exports = router; 