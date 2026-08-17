# DIRS - Dire Dawa Intercity Ride Sharing

## Project Overview
Full-stack ride-sharing app (passenger/driver/admin) with shared ride pooling (VehicleTrip).

## Key URLs
- **Backend (Render)**: `https://dirs-dire-dawa-intercity-ride-sharing.onrender.com/api` (note: correct spelling "intercity" NOT "interacity")
- **Frontend (Vercel)**: `https://dirs-dire-dawa-intercity-ride-shari-psi.vercel.app/`

## Database
- **MongoDB Atlas**: `mongodb+srv://fikaduabraham093_db_user:WU2O9NH1X1Y1QN9O@dirs.q3rw6ml.mongodb.net/dirs_diredawa`

## Backend Route Prefixes (server.js)
`/api/auth`, `/api/users`, `/api/vehicles`, `/api/rides`, `/api/payments`, `/api/ratings`, `/api/notifications`, `/api/sos`, `/api/safety`, `/api/chat`, `/api/admin`, `/api/referrals`

## Vehicle Types
`car`, `minivan`, `minibus`, `bajaj`, `bus` — capacity max is 30

## Intercity Destinations (14)
Harar, Addis Ababa, Jijiga, Combolcha, Awash, Debre Markos, Adama, Hawassa, Bahir Dar, Mekelle, Jimma, Dessie, Chiro, Asebe Teferi

## Key Models
- **VehicleTrip**: Shared ride pooling with atomic seat locking, `status: scheduled|boarding|in_progress|completed|cancelled`, `farePerSeat`, `passengers[]`
- **RideRequest**: Has `selectedSeats: [String]` and `vehicleTrip: ObjectId`
- **User**: Has `currentArea`, `favoriteLocations`, `favorites`, `emergencyContacts`

## Build & Deploy
- Frontend: `cd web-app && npm run build` (auto-deploys to Vercel from `main`)
- Backend: Manual redeploy on Render after changes

## Code Conventions
- Frontend: React with lazy loading, `useLanguage()` for i18n, `useAuth()` for auth/socket
- Backend: Express.js, Mongoose, single controller pattern for admin routes
- Cloudinary: cloud `duzooyoyt`, unsigned preset `dirs_unsigned`

## Known Issues
- Render/Cloudflare `x-render-routing: no-server`: External HTTP requests sometimes return 404 (infrastructure issue)
- Backend jest suites fail on pre-existing `../server` require issue
