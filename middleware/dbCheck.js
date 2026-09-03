const mongoose = require('mongoose');

// Returns a clear error if MongoDB is not connected instead of letting queries buffer & timeout
const dbCheck = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database is not connected. Please try again in a moment.',
    });
  }
  next();
};

module.exports = dbCheck;
