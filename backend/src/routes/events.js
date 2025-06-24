const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all events (public)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('category').optional().trim(),
  query('search').optional().trim(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 10,
      category,
      search,
      dateFrom,
      dateTo
    } = req.query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      status: { not: 'CANCELLED' }
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          venue: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true
            }
          },
          _count: {
            select: {
              bookings: true
            }
          }
        },
        orderBy: { date: 'asc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.event.count({ where })
    ]);

    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get single event (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        venue: {
          include: {
            seats: {
              where: { status: 'AVAILABLE' },
              select: {
                id: true,
                row: true,
                number: true,
                section: true,
                price: true,
                status: true
              }
            }
          }
        },
        _count: {
          select: {
            bookings: true,
            reviews: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create event (admin only)
router.post('/', authenticateToken, requireAdmin, [
  body('title').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('date').isISO8601(),
  body('duration').isInt({ min: 1 }),
  body('price').isFloat({ min: 0 }),
  body('category').trim().notEmpty(),
  body('venueId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      date,
      duration,
      price,
      category,
      venueId,
      image
    } = req.body;

    // Check if venue exists
    const venue = await prisma.venue.findUnique({
      where: { id: venueId }
    });

    if (!venue) {
      return res.status(400).json({ error: 'Venue not found' });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        duration: parseInt(duration),
        price: parseFloat(price),
        category,
        venueId,
        image
      },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event (admin only)
router.put('/:id', authenticateToken, requireAdmin, [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim().notEmpty(),
  body('date').optional().isISO8601(),
  body('duration').optional().isInt({ min: 1 }),
  body('price').optional().isFloat({ min: 0 }),
  body('category').optional().trim().notEmpty(),
  body('status').optional().isIn(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = { ...req.body };

    // Convert date string to Date object if provided
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    // Convert numeric fields
    if (updateData.duration) {
      updateData.duration = parseInt(updateData.duration);
    }
    if (updateData.price) {
      updateData.price = parseFloat(updateData.price);
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true
          }
        }
      }
    });

    res.json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Update event error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event has bookings
    const bookingsCount = await prisma.booking.count({
      where: { eventId: id }
    });

    if (bookingsCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete event with existing bookings' 
      });
    }

    await prisma.event.delete({
      where: { id }
    });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Get event categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await prisma.event.findMany({
      select: { category: true },
      distinct: ['category']
    });

    const categoryList = categories.map(cat => cat.category);
    res.json({ categories: categoryList });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router; 