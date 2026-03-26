const jwt = require('jsonwebtoken');

// Same secret as used in auth.js
const JWT_SECRET = 'secretkey';

// Middleware to verify JWT token
module.exports = function(req, res, next) {
  // Get token from header (Format: "Bearer <token>" or just "<token>")
  let token = req.header('Authorization');

  // Check if no token is provided
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // If token has "Bearer " prefix, strip it
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length).trimLeft();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Add user info from payload to the request object
    req.user = decoded.user;
    
    // Continue to the next middleware or route handler
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
