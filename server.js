const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & parsing middleware
app.use(helmet());
// Configure CORS: allow specific frontend origin in production via FRONTEND_URL
const frontendOrigin = process.env.FRONTEND_URL || '*';
app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic rate limiting to protect public endpoints
const limiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 200 });
app.use(limiter);

// Request logger (debugging)
const requestLogger = require('./request-logger');
app.use(requestLogger);


// Initialize DB connection
connectDB();

// Starter route
app.get('/', (req, res) => {
  return res.json({ message: 'StayNest Backend Running' });
});

// Mount route files
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// API routes
const pgRoutes = require('./routes/pgs');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');
const roommateRoutes = require('./routes/roommates');
const paymentRoutes = require('./routes/payments');

app.use('/api/pgs', pgRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/roommates', roommateRoutes);
app.use('/api/payments', paymentRoutes);

// 404 for unknown API endpoints
app.use((req, res) => {
  return res.status(404).json({ message: 'Endpoint not found' });
});

// Global error handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`StayNest backend listening on port ${PORT}`);
  });
}

module.exports = app;
