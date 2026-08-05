# Digital Intercity and Ride Sharing System (DIRS)

A web-based ride-sharing platform for Dire Dawa City, Ethiopia.

## Features

### Passenger App
- User registration and login with OTP verification
- Search and book rides (intra-city and intercity)
- Real-time driver tracking
- Multiple payment options (Cash, Telebirr, Chapa)
- Rate and review drivers
- SOS emergency alerts
- Trip sharing with contacts

### Driver App
- Driver registration and vehicle upload
- Accept/decline ride requests
- Real-time navigation
- Earnings dashboard
- Trip history

### Admin Dashboard
- User management
- Driver verification
- Trip monitoring
- Payment oversight
- SOS alert handling
- Report generation

## Tech Stack

- **Frontend**: React.js, Socket.io Client, Google Maps API
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: MongoDB (MongoDB Atlas)
- **Authentication**: JWT, OTP (Africa's Talking SMS)
- **Payments**: Telebirr, Chapa
- **Styling**: CSS3

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Setup Instructions

### 1. Clone the repository

```bash
cd dirs-diredawa
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create `.env` file in the backend folder:

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/dirs_diredawa

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# SMS (Africa's Talking)
AFRICASTALKING_API_KEY=your_api_key
AFRICASTALKING_USERNAME=your_username

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_key

# Payments
TELEBIRR_APP_ID=your_telebirr_app_id
CHAPA_SECRET_KEY=your_chapa_secret_key
CHAPA_PUBLIC_KEY=your_chapa_public_key

# Pricing
BASE_FARE_INTRA_CITY=50
PER_KM_RATE_INTRA_CITY=15
BASE_FARE_INTER_CITY=150
PER_KM_RATE_INTER_CITY=20
PLATFORM_COMMISSION=15

# Frontend URLs
PASSENGER_APP_URL=http://localhost:3001
DRIVER_APP_URL=http://localhost:3002
ADMIN_APP_URL=http://localhost:3003
```

### 4. Start Backend Server

```bash
cd backend
npm run dev
```

Server runs on http://localhost:5000

### 5. Install and Start Passenger App

```bash
cd passenger-app
npm install
npm start
```

App runs on http://localhost:3001

### 6. Install and Start Driver App

```bash
cd driver-app
npm install
npm start
```

App runs on http://localhost:3002

### 7. Install and Start Admin Dashboard

```bash
cd admin-dashboard
npm install
npm start
```

Dashboard runs on http://localhost:3003

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `GET /api/auth/me` - Get current user

### Rides
- `POST /api/rides` - Create ride request
- `POST /api/rides/:id/accept` - Accept ride (driver)
- `POST /api/rides/:id/cancel` - Cancel ride
- `GET /rides/passenger/trips` - Get passenger trips
- `GET /rides/driver/trips` - Get driver trips

### Payments
- `POST /api/payments/trip/:id` - Process payment
- `GET /api/payments/earnings` - Get driver earnings
- `POST /api/payments/withdraw` - Request withdrawal

### Ratings
- `POST /api/ratings/trip/:id` - Create rating
- `GET /api/ratings/user/:id` - Get user ratings

### Admin
- `GET /api/admin/dashboard` - Get dashboard stats
- `GET /api/admin/users` - Get all users
- `POST /api/admin/drivers/:id/verify` - Verify driver

## Project Structure

```
dirs-diredawa/
├── backend/
│   ├── src/
│   │   ├── config/        # Database config
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/     # Auth, validation
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── sockets/       # Socket.io handlers
│   │   └── server.js      # Entry point
│   └── tests/             # Test files
├── passenger-app/         # React passenger app
├── driver-app/           # React driver app
└── admin-dashboard/      # React admin dashboard
```

## Testing

```bash
cd backend
npm test
```

## License

This project is for educational purposes.
