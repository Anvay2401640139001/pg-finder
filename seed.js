const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const PG = require('./models/PG');
const Review = require('./models/Review');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/staynest_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await PG.deleteMany({});
    await Review.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    // Create demo users (owners)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = await User.create([
      { name: 'Raj Kumar', email: 'raj@staynest.com', password: hashedPassword, role: 'admin' },
      { name: 'Priya Singh', email: 'priya@staynest.com', password: hashedPassword, role: 'user' },
      { name: 'Amit Patel', email: 'amit@staynest.com', password: hashedPassword, role: 'user' },
    ]);

    console.log('Created users');

    // Create demo PGs
    const pgs = await PG.create([
      {
        title: 'Premium Boys PG Near IIT',
        address: '123 Tech Street, Powai',
        city: 'Mumbai',
        rent: 8500,
        deposit: 15000,
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500'],
        features: ['Boys PG', 'AC', 'WiFi', 'Parking'],
        amenities: { rooms: 15, beds: 30, bathrooms: 8, kitchen: 'shared', laundry: true },
        owner: users[0]._id,
      },
      {
        title: 'Cozy Girls Hostel Downtown',
        address: '456 Liberty Lane, Bandra',
        city: 'Mumbai',
        rent: 9500,
        deposit: 18000,
        images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500'],
        features: ['Girls PG', 'AC', 'WiFi', 'Gym'],
        amenities: { rooms: 12, beds: 24, bathrooms: 6, kitchen: 'shared', laundry: true },
        owner: users[1]._id,
      },
      {
        title: 'Budget-Friendly Student Hostel',
        address: '789 College Road, Andheri',
        city: 'Mumbai',
        rent: 6500,
        deposit: 10000,
        images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500'],
        features: ['Boys PG', 'WiFi', 'Food Included'],
        amenities: { rooms: 20, beds: 40, bathrooms: 10, kitchen: 'shared', laundry: true },
        owner: users[2]._id,
      },
      {
        title: 'Premium Luxury PG with Pool',
        address: '321 Park Avenue, Powai',
        city: 'Mumbai',
        rent: 14000,
        deposit: 25000,
        images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500'],
        features: ['AC', 'WiFi', 'Pool', 'Gym', 'Food Included'],
        amenities: { rooms: 10, beds: 20, bathrooms: 8, kitchen: 'shared', laundry: true, pool: true },
        owner: users[0]._id,
      },
      {
        title: 'Safe Girls PG Near University',
        address: '654 University Lane, Dadar',
        city: 'Mumbai',
        rent: 11000,
        deposit: 20000,
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500'],
        features: ['Girls PG', 'AC', 'WiFi', 'Security'],
        amenities: { rooms: 16, beds: 32, bathrooms: 8, kitchen: 'shared', laundry: true },
        owner: users[1]._id,
      },
      {
        title: 'Co-working PG with Study Space',
        address: '987 Tech Park, Pune',
        city: 'Pune',
        rent: 7500,
        deposit: 12000,
        images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500'],
        features: ['Boys PG', 'WiFi', 'Study Room', 'Parking'],
        amenities: { rooms: 18, beds: 36, bathrooms: 9, kitchen: 'shared', laundry: true },
        owner: users[2]._id,
      },
    ]);

    console.log('Created PGs');

    // Create demo reviews
    await Review.create([
      {
        user: users[1]._id,
        pg: pgs[0]._id,
        rating: 5,
        comment: 'Excellent PG! Very clean, friendly staff, and great location. Highly recommend!',
      },
      {
        user: users[2]._id,
        pg: pgs[0]._id,
        rating: 4,
        comment: 'Good facilities. The WiFi speed could be better but overall satisfied.',
      },
      {
        user: users[0]._id,
        pg: pgs[1]._id,
        rating: 5,
        comment: 'Amazing girls hostel. Safe, clean, and great food. Perfect for students!',
      },
    ]);

    console.log('Created reviews');
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seedDatabase();
