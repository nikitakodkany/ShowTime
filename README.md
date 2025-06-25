# 🎫 Show Time - Full-Stack Ticket Booking Platform

A modern, production-ready ticket booking application similar to Ticketmaster, built with React, Node.js, and PostgreSQL. Features real-time seat selection, secure payments, comprehensive search and filtering, Ticketmaster API integration, personalized user experience, and beautiful dark mode interface.

![Ticket Event Platform](https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=for-the-badge&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)
![Ticketmaster API](https://img.shields.io/badge/Ticketmaster-API-orange?style=for-the-badge)
![Dark Mode](https://img.shields.io/badge/Dark%20Mode-Supported-purple?style=for-the-badge)

## ✨ Features

### 🎭 For Event Attendees
- **Advanced Event Discovery**: 
  - 🔍 **Smart Search**: Search by event name, artist, venue, or location
  - 📍 **Location Filtering**: Find events in specific cities or regions
  - 📅 **Date Filtering**: Filter by today, this week, this month, or all dates
  - 💰 **Price Filtering**: Filter by price ranges (Under $50, $50-$100, $100-$200, Over $200)
  - 🎯 **Category Filtering**: Browse by Concert, Theater, Sports, or All events
  - 📊 **Sorting Options**: Sort by date, price, or name
  - 🎨 **Real-time Results**: Instant filtering and search results
- **Personalized User Experience**:
  - 👤 **User Profiles**: Complete profile management with preferences and booking history
  - ⭐ **Favorite Artists/Venues**: Save your favorite performers and venues for quick access
  - 🧠 **Smart Recommendations**: AI-powered event suggestions based on your favorites and history
  - 📊 **Personalized Dashboard**: Custom homepage with upcoming events and tailored recommendations
- **Enhanced Event Browsing**:
  - 🎬 **Event Previews**: Watch video or listen to audio previews of events
  - 🎨 **Enhanced Event Cards**: Rich event information with improved layout and visual polish
  - 🌙 **Dark Mode**: Toggle between light and dark themes for comfortable browsing
  - 📱 **Responsive Design**: Optimized for all device sizes with smooth animations
- **Ticketmaster Integration**: Real event data from Ticketmaster API with live pricing and availability
- **Interactive Seat Selection**: Real-time seat map with live availability updates
- **Secure Booking**: 5-minute seat holds with automatic release
- **Payment Processing**: Stripe integration for secure ticket purchases
- **Mobile Responsive**: Optimized for all device sizes
- **Beautiful UI**: Modern design with Tailwind CSS and smooth animations

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
- **External APIs**: Ticketmaster API integration for real event data
- **Search & Filter Engine**: Advanced client-side filtering with real-time updates
- **Error Handling**: Graceful fallbacks and user-friendly error messages
- **Theme Management**: Dynamic dark/light mode switching with persistent preferences
- **Media Integration**: Support for video and audio event previews

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
│   │   ├── 📁 contexts/          # React contexts (Auth, Socket)
│   │   ├── 🎨 index.css          # Tailwind CSS styles
│   │   ├── 🖥️ App.jsx            # Main application component
│   │   └── 🚀 main.jsx           # Application entry point
│   ├── 🐳 Dockerfile             # Frontend container configuration
│   ├── 🌐 nginx.conf             # Nginx reverse proxy config
│   ├── 🎨 tailwind.config.js     # Tailwind CSS configuration (with dark mode)
│   ├── ⚡ vite.config.js         # Vite build configuration
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
   
   # Create frontend environment file
   touch frontend/.env
   
   # Edit both files with your configuration
   nano backend/.env
   nano frontend/.env
   ```

4. **Configure your environment variables**

   **Backend (.env):**
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

   **Frontend (.env):**
   ```env
   # Ticketmaster API (get from https://developer.ticketmaster.com/)
   VITE_TICKETMASTER_API_KEY=your_ticketmaster_api_key_here
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

## 🎯 How to Use the Features

### 🔍 Search & Filter Functionality
- **Search Bar**: Type to search for events, artists, venues, or locations
- **Real-time Results**: Results update as you type
- **Location Filter**: Enter a city name to find events in that location

### 🎛️ Advanced Filters
1. **Click "Show Filters"** to expand the advanced filtering panel
2. **Date Range**: Choose from:
   - All Dates
   - Today
   - This Week
   - This Month
3. **Price Range**: Filter by:
   - All Prices
   - Under $50
   - $50 - $100
   - $100 - $200
   - Over $200
4. **Sort Options**: Sort by:
   - Date (earliest first)
   - Price (lowest first)
   - Name (alphabetical)

### 🎨 Category Filtering
- **All**: Shows all events
- **Concert**: Music concerts and performances
- **Theater**: Theater shows and plays
- **Sports**: Sporting events

### 🧹 Clear Filters
- Use the **"Clear Filters"** button to reset all search and filter options
- Results summary shows how many events match your criteria

## 👤 User Experience Features

### 🏠 Personalized Dashboard
- **Custom Homepage**: View upcoming events and personalized recommendations
- **Smart Recommendations**: Events suggested based on your favorite artists and venues
- **Quick Access**: Navigate between Dashboard, Events, and Profile seamlessly

### 👤 User Profile Management
- **Profile Information**: View and manage your account details
- **Preferences**: See your favorite artists and venues in one place
- **Booking History**: Track all your past and upcoming bookings
- **Account Settings**: Manage your preferences and account information

### ⭐ Favorites System
- **Favorite Artists**: Click the star button on any event to favorite the artist
- **Favorite Venues**: Save your preferred venues for quick access
- **Smart Recommendations**: Get event suggestions based on your favorites
- **Easy Management**: View and manage all favorites from your profile

### 🎬 Event Previews
- **Video Previews**: Watch short video clips of events when available
- **Audio Previews**: Listen to audio samples for music events
- **Enhanced Cards**: Rich event information with preview media
- **Interactive Elements**: Hover effects and smooth animations

## 🌙 Visual Features

### 🌓 Dark Mode
- **Theme Toggle**: Switch between light and dark themes using the toggle in the navigation bar
- **Persistent Preference**: Your theme choice is remembered during the session
- **Comprehensive Support**: All components and pages support both themes
- **Eye-Friendly**: Dark mode reduces eye strain in low-light environments

### 🎨 Enhanced Event Cards
- **Rich Information**: Display comprehensive event details including:
  - Event title and artist
  - Venue, city, and state
  - Date and time
  - Price range
  - Available seats
  - Category badges
- **Interactive Elements**:
  - Hover effects for better user feedback
  - Favorite buttons for artists and venues
  - Preview media when available
  - Responsive design for all screen sizes
- **Visual Polish**:
  - Smooth transitions and animations
  - Consistent spacing and typography
  - Professional color scheme
  - Clear call-to-action buttons

### 📱 Responsive Design
- **Mobile Optimized**: Perfect experience on smartphones and tablets
- **Desktop Friendly**: Full-featured interface on larger screens
- **Touch Friendly**: Optimized for touch interactions
- **Cross-Platform**: Works seamlessly across all devices and browsers

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
```

### User Endpoints
```
GET    /api/users                  # Get all users (admin only)
GET    /api/users/:id              # Get user details
PUT    /api/users/:id              # Update user (admin only)
DELETE /api/users/:id              # Delete user (admin only)
```

## 🔧 Development Scripts

### Root Level Commands
```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend
npm run install:all      # Install dependencies for all packages
npm run build            # Build both frontend and backend
npm run test             # Run tests for all packages
npm run docker:build     # Build Docker images
npm run docker:up        # Start Docker containers
npm run docker:down      # Stop Docker containers
```

### Backend Commands
```bash
cd backend
npm run dev              # Start development server with nodemon
npm run start            # Start production server
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with sample data
npm run db:reset         # Reset database (migrate + seed)
npm run test             # Run backend tests
```

### Frontend Commands
```bash
cd frontend
npm run dev              # Start Vite development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run test             # Run frontend tests
```

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Admin and user role management
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Cross-origin resource sharing configuration
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Protection**: Content Security Policy headers
- **HTTPS Ready**: Secure headers and SSL configuration

## 🚀 Deployment

### Production Environment Variables
```env
# Backend
NODE_ENV=production
DATABASE_URL=your_production_database_url
JWT_SECRET=your_production_jwt_secret
STRIPE_SECRET_KEY=your_production_stripe_key
CORS_ORIGIN=https://yourdomain.com

# Frontend
VITE_TICKETMASTER_API_KEY=your_production_ticketmaster_key
```

### Docker Production Build
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ticketmaster API** for providing real event data
- **Tailwind CSS** for the beautiful UI components and dark mode support
- **Prisma** for the excellent database ORM
- **Socket.IO** for real-time functionality
- **Stripe** for secure payment processing

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/ticket-event-app/issues) page
2. Create a new issue with detailed information
3. Contact the development team

---

**Made with ❤️ by the Show Time Team**
