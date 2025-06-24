# 🎫 Show Time - Full-Stack Ticket Booking Platform

A modern, production-ready ticket booking application similar to Ticketmaster, built with React, Node.js, and PostgreSQL. Features real-time seat selection, secure payments, and comprehensive admin management.

![Ticket Event Platform](https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=for-the-badge&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)

## ✨ Features

### 🎭 For Event Attendees
- **Browse Events**: Search and filter events by category, date, and location
- **Interactive Seat Selection**: Real-time seat map with live availability updates
- **Secure Booking**: 5-minute seat holds with automatic release
- **Payment Processing**: Stripe integration for secure ticket purchases
- **User Dashboard**: View booking history and manage profile
- **Mobile Responsive**: Optimized for all device sizes

### 👨‍💼 For Administrators
- **Event Management**: Create, edit, and delete events with rich details
- **Venue Management**: Manage venues and configure seating arrangements
- **User Management**: View users, manage roles, and access analytics
- **Booking Analytics**: Real-time sales reports and booking statistics
- **Payment Oversight**: Monitor transactions and process refunds

### 🛠️ Technical Features
- **Real-time Updates**: Socket.IO for live seat availability and booking status
- **Authentication**: JWT-based auth with role-based access control
- **Database**: PostgreSQL with Prisma ORM for type-safe queries
- **API**: RESTful API with comprehensive validation and error handling
- **Security**: Rate limiting, CORS, input validation, and security headers
- **Docker Support**: Complete containerization for easy deployment

## 🏗️ Architecture

```
ticket-event-app/
├── 📁 backend/                    # Node.js/Express API Server
│   ├── 📁 src/
│   │   ├── 📁 config/            # Database & app configuration
│   │   ├── 📁 middleware/        # Auth, validation, security
│   │   ├── 📁 routes/            # API endpoints (auth, events, bookings, etc.)
│   │   ├── 📁 socket/            # Real-time Socket.IO handlers
│   │   └── 🖥️ server.js          # Main server entry point
│   ├── 📁 prisma/                # Database schema & migrations
│   ├── 🐳 Dockerfile             # Backend container configuration
│   └── 📦 package.json           # Backend dependencies
├── 📁 frontend/                   # React Application
│   ├── 📁 src/
│   │   ├── 📁 components/        # Reusable UI components
│   │   ├── 📁 contexts/          # React contexts (Auth, Socket)
│   │   ├── 📁 hooks/             # Custom React hooks
│   │   ├── 📁 pages/             # Page components
│   │   ├── 📁 services/          # API service layer
│   │   └── 📁 utils/             # Utility functions
│   ├── 🐳 Dockerfile             # Frontend container configuration
│   ├── 🌐 nginx.conf             # Nginx reverse proxy config
│   └── 📦 package.json           # Frontend dependencies
├── 🐳 docker-compose.yml         # Multi-service orchestration
├── 📦 package.json               # Monorepo configuration
└── 📖 README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **PostgreSQL** 15+
- **Docker** (optional, for containerized deployment)

### Option 1: Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ticket-event-app
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment template
   cp backend/env.example backend/.env
   
   # Edit backend/.env with your configuration
   nano backend/.env
   ```

4. **Configure your environment variables**
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/ticket_event_db"
   
   # JWT Authentication
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   JWT_EXPIRES_IN="7d"
   
   # Server
   PORT=5000
   NODE_ENV="development"
   
   # Stripe (get from https://dashboard.stripe.com/)
   STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
   STRIPE_WEBHOOK_SECRET="whsec_your_stripe_webhook_secret"
   STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
   
   # CORS
   CORS_ORIGIN="http://localhost:3000"
   ```

5. **Set up the database**
   ```bash
   cd backend
   npm run db:migrate    # Create database tables
   npm run db:seed       # Populate with sample data
   ```

6. **Start development servers**
   ```bash
   npm run dev           # Starts both frontend and backend
   ```

7. **Access the application**
   - 🌐 **Frontend**: http://localhost:3000
   - 🔌 **Backend API**: http://localhost:5000
   - 📊 **Health Check**: http://localhost:5000/health

### Option 2: Docker Deployment

1. **Build and start with Docker**
   ```bash
   npm run docker:build
   npm run docker:up
   ```

2. **Access the application**
   - 🌐 **Frontend**: http://localhost:3000
   - 🔌 **Backend API**: http://localhost:5000

## 🔐 Default Test Accounts

The seed script creates these accounts for testing:

| Role | Email | Password |
|------|-------|----------|
| 👨‍💼 Admin | `admin@ticketevent.com` | `admin123` |
| 👤 User | `user@ticketevent.com` | `user123` |

## 📚 API Documentation

### Authentication Endpoints
```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
GET    /api/auth/me                # Get current user
PUT    /api/auth/profile           # Update user profile
PUT    /api/auth/change-password   # Change password
```

### Event Endpoints
```
GET    /api/events                 # List all events (with pagination & filters)
GET    /api/events/:id             # Get event details
GET    /api/events/categories/list # Get event categories
POST   /api/events                 # Create event (admin only)
PUT    /api/events/:id             # Update event (admin only)
DELETE /api/events/:id             # Delete event (admin only)
```

### Booking Endpoints
```
GET    /api/bookings               # Get user bookings
GET    /api/bookings/:id           # Get booking details
POST   /api/bookings               # Create booking
PUT    /api/bookings/:id/cancel    # Cancel booking
GET    /api/bookings/admin/all     # Get all bookings (admin only)
```

### Venue Endpoints
```
GET    /api/venues                 # List all venues
GET    /api/venues/:id             # Get venue details
POST   /api/venues                 # Create venue (admin only)
PUT    /api/venues/:id             # Update venue (admin only)
DELETE /api/venues/:id             # Delete venue (admin only)
GET    /api/venues/:id/seats       # Get venue seats (admin only)
POST   /api/venues/:id/seats       # Create venue seats (admin only)
```

### Payment Endpoints
```
POST   /api/payments/create-intent # Create Stripe payment intent
POST   /api/payments/confirm       # Confirm payment
GET    /api/payments/history       # Get payment history
POST   /api/payments/webhook       # Stripe webhook handler
POST   /api/payments/refund/:id    # Process refund (admin only)
```

### User Management (Admin Only)
```
GET    /api/users                  # List all users
GET    /api/users/:id              # Get user details
PUT    /api/users/:id/role         # Update user role
GET    /api/users/admin/statistics # Get user statistics
```

## 🛠️ Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:frontend` | Start only frontend development server |
| `npm run dev:backend` | Start only backend development server |
| `npm run build` | Build both frontend and backend for production |
| `npm run lint` | Run ESLint on both frontend and backend |
| `npm run lint:fix` | Fix ESLint errors automatically |
| `npm run format` | Format code with Prettier |
| `npm run docker:build` | Build Docker containers |
| `npm run docker:up` | Start Docker containers |
| `npm run docker:down` | Stop Docker containers |

### Database Management

```bash
cd backend

# Run database migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Reset database (drops all data)
npm run db:reset

# Open Prisma Studio (database GUI)
npm run db:studio

# Generate Prisma client
npm run db:generate
```

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ticket_event_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="development"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# File Upload
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=5242880

# CORS
CORS_ORIGIN="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🔧 Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Real-time**: Socket.IO
- **Payments**: Stripe API
- **Validation**: Express-validator
- **Security**: Helmet, CORS, rate limiting
- **File Upload**: Multer with Sharp

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query + Context API
- **Routing**: React Router DOM
- **Real-time**: Socket.IO Client
- **Payments**: Stripe Elements
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx
- **Database**: PostgreSQL
- **Caching**: Redis (optional)
- **Process Manager**: PM2 (production)

## 🚀 Deployment

### Production Deployment with Docker

1. **Set production environment variables**
   ```bash
   # Create production .env files
   cp backend/env.example backend/.env.production
   cp frontend/.env.example frontend/.env.production
   ```

2. **Build and deploy**
   ```bash
   # Build production images
   docker-compose -f docker-compose.prod.yml build

   # Start production services
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Environment-Specific Configurations

- **Development**: Hot reload, detailed logging, CORS enabled
- **Production**: Optimized builds, security headers, rate limiting
- **Testing**: Separate database, mock services

## 🔒 Security Features

- **Authentication**: JWT tokens with secure storage
- **Authorization**: Role-based access control (User/Admin)
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Configured CORS policies
- **Security Headers**: Helmet.js for security headers
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **XSS Protection**: Input sanitization and output encoding

## 📊 Performance Features

- **Database Optimization**: Indexed queries, efficient relationships
- **Caching**: Redis for session storage and caching
- **Image Optimization**: Sharp for image processing
- **Code Splitting**: React lazy loading and dynamic imports
- **Gzip Compression**: Nginx compression for static assets
- **CDN Ready**: Static asset optimization for CDN deployment

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests if applicable
4. **Run linting**: `npm run lint`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and conventions
- Add appropriate error handling and validation
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. **Check the documentation** in this README
2. **Search existing issues** in the repository
3. **Create a new issue** with detailed information
4. **Contact the maintainers** for urgent support

## 🎯 Roadmap

- [ ] **Email Notifications**: Booking confirmations and reminders
- [ ] **Mobile App**: React Native mobile application
- [ ] **Analytics Dashboard**: Advanced reporting and insights
- [ ] **Multi-language Support**: Internationalization (i18n)
- [ ] **Social Login**: Google, Facebook, Apple authentication
- [ ] **QR Code Tickets**: Digital ticket generation
- [ ] **Waitlist System**: Automatic waitlist management
- [ ] **Bulk Operations**: Mass event/venue management
- [ ] **API Rate Limiting**: Tiered API access
- [ ] **Webhook System**: Third-party integrations

---

**Built with ❤️ using modern web technologies**
