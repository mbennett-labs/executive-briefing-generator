/**
 * JWT Authentication Middleware
 * Validates JWT token and attaches user to request
 */

const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to require authentication
 * Validates JWT token from Authorization header
 * Attaches user object to req.user
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get user from database
      const user = await User.findById(decoded.user_id);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Attach user to request (without password_hash)
      req.user = User.toPublic(user);
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  requireAuth
};
