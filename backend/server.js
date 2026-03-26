const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS for frontend integration
app.use(express.json()); // Parse incoming JSON requests

// Dynamically bootstrap a local MongoDB instance in-memory to prevent connection errors
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
    try {
        const mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        
        await mongoose.connect(mongoUri);
        console.log('✅ Connected successfully to automated MongoDB (expenseDB) in-memory instance!');
    } catch (err) {
        console.error('❌ Error bootstrapping automated MongoDB:', err);
    }
})();

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// A simple protected route example to verify middleware
const authMiddleware = require('./middleware/auth');
app.use('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'You have accessed a protected route!', user: req.user });
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
