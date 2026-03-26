const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS for frontend integration
app.use(express.json()); // Parse incoming JSON requests

// Connect to MongoDB
// Note: Ensure you have MongoDB installed and running locally, or replace with your MongoDB Atlas URI
mongoose.connect('mongodb://127.0.0.1:27017/expenseDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB (expenseDB)'))
.catch((err) => console.error('❌ MongoDB Connection Error:', err));

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
