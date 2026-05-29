# StayNest Backend

This folder contains the Express.js backend for StayNest. Follow the steps below to setup and run locally, and refer to the file descriptions for a quick architecture overview.

## Quick start

1. Node.js (>=16) and npm installed.
2. Copy `.env.example` to `.env` and fill values (see MongoDB Atlas instructions below).
3. Install dependencies:

```bash
cd StayNest/backend
npm install
```

4. Seed demo data (optional but helpful):

```bash
# Ensure .env MONGO_URI exists or seed uses local fallback
node seed.js
```

5. Run server (dev):

```bash
npm run dev
```

The API will run on `http://localhost:5000` by default (set `PORT` in `.env`).

## Connect to MongoDB Atlas

1. Create an Atlas cluster at https://cloud.mongodb.com/. 2. Create a database user and whitelist your IP. 3. Get the connection string and paste it into `.env` as `MONGO_URI` (replace `<password>` and DB name).

Example:

```
MONGO_URI=mongodb+srv://myUser:mySecret@cluster0.abcd.mongodb.net/staynest_db?retryWrites=true&w=majority
```

## Folder structure (backend)

- `server.js` — Entry point. Sets up middleware, routes, DB connection, and error handler.
- `package.json` — Project metadata & scripts.
- `.env.example` — Environment variable template.
- `seed.js` — Demo data seeder (creates users, PGs, reviews).
- `request-logger.js` — Lightweight request logger used for debugging.

- `config/`
  - `db.js` — MongoDB connection helper (used by `server.js`).

- `controllers/` — Business logic for each resource (PGs, bookings, payments, reviews, roommates, auth).
  - `pgController.js`
  - `bookingController.js`
  - `paymentController.js`
  - `reviewController.js`
  - `roommateController.js`
  - `authController.js`

- `models/` — Mongoose schemas and models.
  - `PG.js` — PG / property schema.
  - `Booking.js` — Booking schema (tracks payment ids and status).
  - `Review.js` — Reviews tied to users and PGs.
  - `Roommate.js` — Roommate profile schema.
  - `User.js` — User schema (email, password hash, role).

- `routes/` — Express route definitions that map endpoints to controllers.
  - `pgs.js` — `/api/pgs`
  - `bookings.js` — `/api/bookings` (includes order/verify endpoints)
  - `payments.js` — `/api/payments` (alias to bookings order/verify)
  - `reviews.js` — `/api/reviews`
  - `roommates.js` — `/api/roommates`
  - `auth.js` — `/api/auth`

- `middleware/` — Reusable middleware
  - `authMiddleware.js` — Verifies JWT and attaches `req.user`.
  - `errorHandler.js` — Global error handler used by Express.

## API Endpoints (summary)

- `POST /api/auth/register` — Register new user. Body: `{ name, email, password }`.
- `POST /api/auth/login` — Login. Body: `{ email, password }`.
- `GET /api/auth/me` — Protected. Returns user details.

- `GET /api/pgs` — List PGs.
- `GET /api/pgs/:id` — Get PG details.
- `POST /api/pgs` — Create PG (owner/admin).

- `POST /api/bookings` — Create a booking (protected).
- `POST /api/bookings/order` — Create Razorpay order (protected).
- `POST /api/bookings/verify` — Verify payment signature (protected).
- `GET /api/bookings/me` — Get current user's bookings (protected).
- `GET /api/bookings` — Admin: all bookings.

- `POST /api/reviews` — Add review (protected).
- `GET /api/reviews/:pgId` — Get reviews for a PG.

- `POST /api/roommates` — Create roommate profile.
- `GET /api/roommates` — List roommate profiles (filters supported).

## How the frontend connects (simple `fetch` examples)

1. Public: get all PGs

```js
fetch('http://localhost:5000/api/pgs')
  .then(r => r.json())
  .then(data => console.log(data));
```

2. Register / Login

```js
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'User', email: 'a@b.com', password: 'pass' })
}).then(r => r.json()).then(console.log);
```

3. Protected request (include JWT)

```js
const token = localStorage.getItem('staynest_token');
fetch('http://localhost:5000/api/bookings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ pg: pgId, startDate, endDate, totalPrice }),
}).then(r => r.json()).then(console.log);
```

4. Create Razorpay order

```js
fetch('http://localhost:5000/api/payments/order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ bookingId: booking._id, amount: booking.totalPrice })
}).then(r => r.json()).then(console.log);
```

5. Verify payment

```js
fetch('http://localhost:5000/api/payments/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId })
}).then(r => r.json()).then(console.log);
```

## Next recommended improvements (industry-ready)

- Add input validation (`express-validator`) to controllers.
- Add security middleware: `helmet`, stricter `cors` origin.
- Add request-rate limiting (`express-rate-limit`).
- Add structured logging (`winston` or `pino`).
- Add API tests (Jest + Supertest) and CI pipeline.

If you want, I can:

- Add a `.env.example` (done) and `README.md` (this file). 
- Add `helmet` and `express-rate-limit` to `package.json` and wire them in `server.js`.
- Add basic Socket.io chat skeleton.

Tell me which of the recommended improvements to implement next and I'll apply them.
StayNest Backend

This folder contains the Express.js backend for StayNest.

Folder structure (created during Phase 1):

config/      - configuration helpers (database, env)
controllers/ - route handlers (business logic)
models/      - Mongoose schemas & models
routes/      - Express route definitions (API endpoints)
middleware/  - Express middleware (auth, error handlers)
utils/       - helper functions and utilities
server.js    - application entrypoint
.env.example - example environment variables (do not commit .env)

Run locally:

1. copy `.env.example` to `.env` and add `MONGO_URI`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET`.
2. install dependencies: `npm install`
3. start in dev: `npm run dev`

Next: Phase 2 (connect MongoDB and create models).
