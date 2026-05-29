# StayNest — Full Stack Student Accommodation Platform

A professional, production-ready MERN stack application for finding and managing student accommodation (PGs and Hostels).

**Project Status:** Phase 3 (Backend APIs complete, Frontend integrated, Ready for Phase 4)

---

## 📋 Table of Contents

- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Setup Instructions](#setup-instructions)
- [Backend API Endpoints](#backend-api-endpoints)
- [Frontend Integration](#frontend-integration)
- [Deployment](#deployment)
- [Development Roadmap](#development-roadmap)

---

## 🏗️ Project Structure

```
StayNest/
├── frontend/                    # React + Bootstrap UI
│   ├── index.html              # Main HTML
│   ├── style.css               # Global styles
│   ├── api.js                  # API client helper
│   ├── app.js                  # Main app logic
│   └── README.md               # Frontend docs
│
├── backend/                     # Express + MongoDB API
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── README.md
│   ├── controllers/            # Business logic
│   │   ├── authController.js
│   │   ├── pgController.js
│   │   ├── bookingController.js
│   │   ├── reviewController.js
│   │   └── roommateController.js
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js
│   │   ├── PG.js
│   │   ├── Booking.js
│   │   ├── Review.js
│   │   └── Roommate.js
│   ├── routes/                 # API route definitions
│   │   ├── auth.js
│   │   ├── pgs.js
│   │   ├── bookings.js
│   │   ├── reviews.js
│   │   └── roommates.js
│   ├── middleware/             # Express middleware
│   │   ├── authMiddleware.js
│   │   └── README.md
│   ├── utils/                  # Helper functions
│   │   └── README.md
│   ├── server.js               # App entrypoint
│   ├── seed.js                 # Database seeding script
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
└── README.md                   # This file
```

---

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, Vanilla JavaScript
- Bootstrap 5.3.3 (responsive UI)
- Fetch API (async communication)

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT + bcryptjs (authentication)
- Nodemon (dev mode)

**Database:**
- MongoDB Atlas (cloud)
- Mongoose ODM

**Deployment:**
- Frontend: Vercel (planned)
- Backend: Render (planned)

---

## ✨ Features

### Completed
- ✅ Premium responsive UI with Bootstap
- ✅ Dynamic PG card rendering
- ✅ Live search and smart filters
- ✅ User authentication (register/login with JWT)
- ✅ Wishlist system (localStorage)
- ✅ Booking management
- ✅ Reviews and ratings
- ✅ Roommate finder matching
- ✅ RESTful API with Mongoose models
- ✅ Protected routes (JWT auth middleware)

### Planned
- 🔲 Admin panel for PG management
- 🔲 Email notifications
- 🔲 Payment gateway integration
- 🔲 Chat/messaging system
- 🔲 Google Maps integration
- 🔲 Advanced analytics dashboard

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14+) and npm
- MongoDB Atlas account (free tier available)
- Git

### Backend Setup

1. **Clone and navigate:**
```bash
cd StayNest/backend
```

2. **Install dependencies:**
```bash
npm install express cors mongoose dotenv bcryptjs jsonwebtoken
npm install -D nodemon
```

3. **Create `.env` file** (copy from `.env.example`):
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/staynest_db
JWT_SECRET=your_super_secret_key_here
```

4. **Seed database** (optional - loads demo PGs):
```bash
node seed.js
```

5. **Start development server:**
```bash
npm run dev
```

Server runs on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend:**
```bash
cd ../frontend
```

2. **Update API base URL** in `api.js` if backend URL differs:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

3. **Open in browser:**
```bash
open index.html
```
Or use a local server:
```bash
python -m http.server 3000
```

Frontend runs on `http://localhost:3000`

---

## 🔌 Backend API Endpoints

### Authentication
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login and get JWT token

### PGs
- `GET /api/pgs` — List all PGs
- `GET /api/pgs/:id` — Get single PG details
- `POST /api/pgs` — Create PG (admin only)

### Bookings
- `POST /api/bookings` — Create booking (protected)
- `GET /api/bookings` — List all bookings

### Reviews
- `POST /api/reviews` — Create review (protected)
- `GET /api/reviews/:pgId` — Get reviews for a PG

### Roommates
- `POST /api/roommates` — Create roommate profile
- `GET /api/roommates` — List profiles with optional filters

**All POST requests require JWT token in header:**
```
Authorization: Bearer <your_token>
```

---

## 🌐 Frontend Integration

### How It Works

1. **Authentication** (`api.js`)
   - User clicks "Login" → modal opens
   - Submit email + password
   - Frontend calls `auth.login()` or `auth.register()`
   - Backend validates, returns JWT token
   - Token stored in `localStorage` for future requests

2. **Fetching PGs** (`app.js`)
   - On load, `initApp()` calls `pgs.getAll()`
   - Backend queries MongoDB, returns PG array
   - Frontend renders cards with Bootstrap grid

3. **Booking Flow**
   - User clicks "Book Now" on a PG
   - Booking modal opens with form
   - Submit → `bookings.create()` sends request
   - Backend creates document linked to user
   - Success message shown

4. **Reviews**
   - User clicks "Reviews" 
   - `reviews.getByPg(pgId)` fetches existing reviews
   - User can add new review
   - `reviews.create()` posts to backend

### API Error Handling

All API calls include try-catch blocks. Errors display as alert:
```javascript
try {
  await pgs.getAll();
} catch (err) {
  showAlert(`Error: ${err.message}`, 'danger');
}
```

---

## 📦 Deployment

### Backend (Render)

1. Push code to GitHub
2. Connect Render to GitHub repo
3. Set environment variables in Render dashboard
4. Deploy (auto-redeploys on push)

### Frontend (Vercel)

1. Push frontend folder to GitHub
2. Import project in Vercel
3. Vercel auto-detects static site
4. Set production API URL (backend on Render)
5. Deploy

---

## 🗓️ Development Roadmap

### Phase 1 ✅
- Backend scaffold with Express
- Folder structure (config, controllers, models, routes, middleware)
- Starter server and middleware setup

### Phase 2 ✅
- MongoDB connection with Mongoose
- 5 data models (User, PG, Booking, Review, Roommate)
- Database seed script

### Phase 3 ✅
- RESTful APIs for all features
- JWT authentication (register/login)
- Protected routes
- Frontend integration

### Phase 4 (Next)
- Admin panel (add/edit/delete PGs)
- Email notifications (bookings, reviews)
- Advanced filtering and search

### Phase 5
- Payment gateway (Stripe/Razorpay)
- Chat/messaging
- Google Maps integration

---

## 💡 Best Practices

### Code Organization
- Controllers handle business logic
- Models define schema and validation
- Routes map HTTP methods to controllers
- Middleware handles cross-cutting concerns

### Security
- Passwords hashed with bcryptjs (salt rounds: 10)
- JWTs expire in 7 days
- Protected routes verify token
- `.env` stores secrets (never commit)

### Error Handling
- All async functions wrapped in try-catch
- Meaningful error messages returned to frontend
- Validation on both frontend and backend

### Database
- Mongoose validates on save
- Indexes on frequently queried fields
- Relationships via `ref` (population)

---

## 🤝 Contributing

1. Create a feature branch
2. Make changes and test locally
3. Commit with clear messages
4. Push and open PR

---

## 📞 Support

For questions or issues:
- Check [Backend README](./backend/README.md)
- Check [Frontend folder](./frontend/)
- Review [API Endpoints](#backend-api-endpoints) above

---

## 📄 License

MIT License — feel free to use for educational and commercial projects.

---

**Made with ❤️ for students finding their perfect stay.**
