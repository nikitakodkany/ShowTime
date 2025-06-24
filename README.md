# Ticket Event App

A full-stack ticket booking application similar to Ticketmaster, built with React, Node.js, and PostgreSQL.

## Features

### User Features
- Browse events and venues
- View event details with seat maps
- Interactive seat selection with real-time availability
- Secure checkout with Stripe integration
- User dashboard for booking history
- JWT-based authentication

### Admin Features
- Admin dashboard for event and venue management
- Create, update, and delete events
- View ticket sales and booking analytics
- Manage venues and seating arrangements

### Technical Features
- Real-time seat locking with Socket.IO
- Role-based access control
- RESTful API with Express.js
- PostgreSQL database with Prisma ORM
- Modern React frontend with Tailwind CSS
- Docker support for easy deployment

## Project Structure

```
ticket-event-app/
├── frontend/          # React application
├── backend/           # Node.js/Express API
├── docker-compose.yml # Docker configuration
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL
- Docker (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ticket-event-app
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

4. Configure your environment variables in `backend/.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/ticket_event_db"
JWT_SECRET="your-jwt-secret"
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
```

5. Set up the database:
```bash
cd backend
npm run db:migrate
npm run db:seed
```

6. Start the development servers:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Docker Setup

To run with Docker:

```bash
npm run docker:build
npm run docker:up
```

## API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Events
- `GET /api/events` - List all events
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (admin only)
- `PUT /api/events/:id` - Update event (admin only)
- `DELETE /api/events/:id` - Delete event (admin only)

### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details

### Venues
- `GET /api/venues` - List all venues
- `POST /api/venues` - Create venue (admin only)
- `PUT /api/venues/:id` - Update venue (admin only)

## Development

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production
- `npm run lint` - Run linting on both frontend and backend
- `npm run format` - Format code with Prettier

### Database Migrations

```bash
cd backend
npm run db:migrate    # Run migrations
npm run db:seed       # Seed database with sample data
npm run db:reset      # Reset database
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License 