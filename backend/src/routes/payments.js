const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { body, query, validationResult } = require('express-validator');
const { prisma } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create payment intent
router.post('/create-intent', [
  body('bookingId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId } = req.body;

    // Get booking with event and seat details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
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

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({ error: 'Booking is not in pending status' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalPrice * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        bookingId: booking.id,
        eventId: booking.event.id,
        userId: req.user.id
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm payment
router.post('/confirm', [
  body('bookingId').notEmpty(),
  body('paymentIntentId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, paymentIntentId } = req.body;

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Update booking and create payment record in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { 
          status: 'CONFIRMED',
          paymentId: paymentIntentId
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

      // Update seat status to sold
      await tx.seat.update({
        where: { id: updatedBooking.seatId },
        data: { status: 'SOLD' }
      });

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          stripeId: paymentIntentId,
          amount: updatedBooking.totalPrice,
          currency: 'usd',
          status: 'SUCCEEDED',
          bookingId: bookingId
        }
      });

      return { booking: updatedBooking, payment };
    });

    res.json({
      message: 'Payment confirmed successfully',
      booking: result.booking,
      payment: result.payment
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Get payment history
router.get('/history', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          booking: {
            userId: req.user.id
          }
        },
        include: {
          booking: {
            include: {
              event: {
                select: {
                  title: true,
                  date: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.payment.count({
        where: {
          booking: {
            userId: req.user.id
          }
        }
      })
    ]);

    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      // Update booking status if not already updated
      try {
        await prisma.booking.updateMany({
          where: {
            paymentId: paymentIntent.id,
            status: 'PENDING'
          },
          data: { status: 'CONFIRMED' }
        });
      } catch (error) {
        console.error('Error updating booking status:', error);
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Refund payment (admin only)
router.post('/refund/:paymentId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            event: true,
            seat: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Process refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripeId
    });

    // Update payment and booking status
    const result = await prisma.$transaction(async (tx) => {
      // Update payment status
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED' }
      });

      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'REFUNDED' }
      });

      // Free up the seat
      await tx.seat.update({
        where: { id: payment.booking.seatId },
        data: { status: 'AVAILABLE' }
      });

      return { payment: updatedPayment, booking: updatedBooking };
    });

    res.json({
      message: 'Refund processed successfully',
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      },
      payment: result.payment,
      booking: result.booking
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

module.exports = router; 